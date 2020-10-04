/*
    Extended Matrix class for EMviq

    author: bruno.fanini_AT_gmail.com

===========================================================*/
import EMUtils from "./EMutils.js";
import EMNode from "./EMnode.js";
import Period from "./period.js";

/**
Class representing a single Extended Matrix
@class EM
@example 
new EMVIQ.EM()
*/
export default class EM {

constructor(basepath){
    this._id     = -1;
    this._jxRoot = undefined;

    this.timeline   = [];   // sorted array of periods
    this.proxyNodes = {};   // Fast access to proxies by ID (e.g. "US100")
    this.EMnodes    = {};   // EM nodes

    this.setBaseFolder(basepath);
}

setBaseFolder(basepath){
    if (basepath === undefined) return;

    this.basepath    = basepath;
    this.pathproxies = basepath + "/proxies/";
    this.pathgraphml = basepath + "/em.graphml";
}

// Parse GraphML (yED)
parseGraphML(onSuccess, onFail){
    self = this;

    $.get( this.pathgraphml, (xml)=>{
        let jx = EMVIQ.x2js.xml_str2json( xml );
        let headnode = jx.graphml.graph.node; //.graph;

        let tnode = self.findDataWithKey(headnode, EMVIQ.YED_dNodeGraphics);
        if (tnode) self.buildTimeline(tnode.TableNode);

        //console.log(headnode);

        self._jxRoot = headnode.graph;
        self._mainGMLRoot = jx.graphml.graph;

        if (onSuccess) onSuccess();

    },"text").fail( ()=>{ // was "xml" type // XML failed to load
        console.log("ERROR Loading EM GraphML");
        if (onFail) onFail();
    });
}

getAttribute(node, attrname){
    if (!node) return undefined;
    return node["@"+attrname];
}

findDataWithKey(node, keyvalue){
    var data = node.data;
    if (!data) return undefined;

    if (Array.isArray(data)){
        if (data[0] && this.getAttribute(data[0],"key") === keyvalue ) return data[0];
        if (data[1] && this.getAttribute(data[1],"key") === keyvalue ) return data[1];
        if (data[2] && this.getAttribute(data[2],"key") === keyvalue ) return data[2];
        //if (this.getAttribute(data[3],"key") === keyvalue ) return data[3];
        }
    else if (this.getAttribute(data,"key") === keyvalue ) return data;
}

getNodeTime(node){
    if (!node.data) return undefined;

    var d = this.findDataWithKey(node, EMVIQ.YED_dNodeGraphics);
    //if (!d) return undefined;

    var G = d.GenericNode || d.ShapeNode || d.SVGNode;
    if (!G) return undefined;

    G = G.Geometry;
    if (!G) return undefined;

    var t = parseFloat(this.getAttribute(G, "y"));
    return -t; // note: we reverse time
}

getNodeShape(node){
    if (!node.data) return undefined;

    var d = this.findDataWithKey(node, EMVIQ.YED_dNodeGraphics);

    if (!d.ShapeNode) return undefined;
    var s = d.ShapeNode.Shape;

    if (!s) return undefined;

    return this.getAttribute(s, "type");

    //console.log(d);
}

getNodeFields(node){
    //console.log(node);

    let R = {
        xmlID: undefined,
        description: undefined,
        url: undefined,    
        label: undefined
        };

    // ID
    let attrID = this.getAttribute(node, "id");
    if (attrID){
        //console.log(attrID);
        R.xmlID = String(attrID);
        }

    // URL
    let du = this.findDataWithKey(node, EMVIQ.YED_dAttrURL);
    if (du && du.__cdata){
        //console.log(du.__cdata);
        //console.log("URL>>>>"+du);
        R.url = du.__cdata; //String(du.__cdata);
        }
    
    // Description
    let dd = this.findDataWithKey(node, EMVIQ.YED_dAttrDesc);
    if (dd) R.description = String(dd.__cdata);

    // Label
    let dl = this.findDataWithKey(node, EMVIQ.YED_dNodeGraphics);
    if (dl){
        let bSwimlane = false;
        let m = dl.GenericNode || dl.SVGNode || dl.ShapeNode;
        if (!m && dl.TableNode){
            m = dl.TableNode;
            bSwimlane = true;
            }

        if (!bSwimlane && m){
            m = m.NodeLabel;
            //console.log(m.toString());
            if (m) R.label = m.toString();
            }
        }
    
    //console.log(R);
    return R;
}

getNodeType(node){
    if (!node.data) return undefined;

    let d  = this.findDataWithKey(node, EMVIQ.YED_dNodeGraphics);
    let dd = this.findDataWithKey(node, EMVIQ.YED_dAttrDesc);
    
    if (!d) return undefined;

    // Determine if continuity node
    if (dd && dd.__cdata){
        if (dd.__cdata === "_continuity") return EMVIQ.NODETYPES.CONTINUITY;
        }

    // Determine first on shape
    if (d.ShapeNode){
        let s = d.ShapeNode.Shape;

        if (!s) return undefined;

        // FIXME: use indexof
        let a = this.getAttribute(s, "type");
        if (a === EMVIQ.YED_sSeriation) return EMVIQ.NODETYPES.SERIATION;
        if (a === EMVIQ.YED_sSF)        return EMVIQ.NODETYPES.SPECIALFIND;
        if (a === EMVIQ.YED_sUS)        return EMVIQ.NODETYPES.US;
        if (a === EMVIQ.YED_sUSVN)      return EMVIQ.NODETYPES.USVN;
        if (a === EMVIQ.YED_sUSVS)      return EMVIQ.NODETYPES.USVS;
        }

    // BPMN (Property or Document)
    if (d.GenericNode){
        let sp = d.GenericNode.StyleProperties;
        if (!sp) return;

        sp = this.getAttribute(sp.Property[3], "value");
        if (!sp) return;

        if (sp === "ARTIFACT_TYPE_DATA_OBJECT") return EMVIQ.NODETYPES.DOCUMENT;
        if (sp === "ARTIFACT_TYPE_ANNOTATION") return EMVIQ.NODETYPES.PROPERTY;
        }

    // SVG type
    if (d.SVGNode){
        let M = d.SVGNode.SVGModel;
        if (!M) return undefined;
        if (!M.SVGContent) return undefined;
        
        M = parseInt(this.getAttribute(M.SVGContent, "refid"));
        if (M === 1) return EMVIQ.NODETYPES.EXTRACTOR;
        if (M === 2) return EMVIQ.NODETYPES.COMBINER;
        }

    return undefined;   // not recognized
}

// Extract Timeline from yED mess
buildTimeline(tablenode){
    var g = tablenode.Geometry;
    if (!g) return;

    //console.log(tablenode);

    let yStart = parseFloat(this.getAttribute(g, "y"));
    //console.log(yStart);

    let nodelabels = tablenode.NodeLabel;
    if (!nodelabels) return;

    let TL = {}; // timeline
    this.timeline = []; // clear main timeline

    for (let i = 0; i < nodelabels.length; i++){
        let L = nodelabels[i];
        
        let pstr = L.toString().trim(); // period string
        //console.log(pstr);

        let strID = undefined;
        if (i>0) strID = "row_"+(i-1); // First nodelabel is header row
        //if (L.ModelParameter && L.ModelParameter.RowNodeLabelModelParameter) strID = ;

        let tMid = parseFloat(this.getAttribute(L, "y"));
        tMid += (0.5 * parseFloat(this.getAttribute(L, "width")) ); // "width" instead of "height" because label is rotated 90.deg

        let pColorHex =  this.getAttribute(L,"backgroundColor");

        // FIXME: if (tColor) tColor = ATON.utils.hexToRGBlin(pColorHex);
        //console.log(tColor);

        if (strID){
            TL[strID] = {};
            TL[strID].name  = pstr;
            TL[strID].min   = tMid + yStart;
            TL[strID].max   = tMid + yStart;

            if (pColorHex) TL[strID].color = new THREE.Color( pColorHex );
        }
    }

    // Retrieve spans in a dirty dirty way...
    if (!tablenode.Table || !tablenode.Table.Rows || !tablenode.Table.Rows.Row) return;
    var spantable = tablenode.Table.Rows.Row;

    // For each row
    for (let r = 0; r < spantable.length; r++){
        var row = spantable[r];

        var rID = this.getAttribute(row, "id");
        var h   = 0.5 * parseFloat(this.getAttribute(row,"height"));

        if (TL[rID]){
            //console.log(rID);

            TL[rID].min += h;
            TL[rID].max -= h;

            // note: we reverse time
            TL[rID].min = -TL[rID].min;
            TL[rID].max = -TL[rID].max;

            // Add to main timeline
            //this.timeline.push(TL[rID]);
            this.timeline.push( 
                new Period(TL[rID].name).setMin(TL[rID].min).setMax(TL[rID].max).setColor(TL[rID].color)
            );
        }
    }

    // Sort timeline
    this.timeline.sort( EMUtils.comparePeriod );

    this.timeline.forEach( p => {
        let pGroup = ATON.createSemanticNode(p.name);
        pGroup.attachToRoot();

        EMUtils.getOrCreateEMData(pGroup).pcolor = p.color;
        });

    console.log(this.timeline);
    console.log(ATON.semnodes);
}

getPeriodFromName(nameid){
    if (!this.timeline) return undefined;
    let numPeriods = this.timeline.length;

    for (let p = 0; p < numPeriods; p++){
        if (this.timeline[p].name === nameid) return this.timeline[p];
    }
        
    return undefined;
}

getPeriodIndexFromName(nameid){
    if (!this.timeline) return undefined;
    let numPeriods = this.timeline.length;

    for (let p = 0; p < numPeriods; p++){
        if (this.timeline[p].name === nameid) return p;
    }
        
    return undefined;
}

getPeriodIndexFromTime(t){
    if (!this.timeline) return undefined;
    let numPeriods = this.timeline.length;

    for (let p = 0; p < numPeriods; p++){
        if (this.timeline[p].min < t && t < this.timeline[p].max) return p;
    }

    //return (numPeriods-1);
    return undefined;
}

realizeProxyGraphFromJSONNode(graphnode){
    //let G = ATON.createSemanticNode();

    let nodes;
    if (!graphnode) nodes = this._jxRoot.node;
    else nodes = graphnode.node;

    for (let i = 0; i < nodes.length; i++){
        let n = nodes[i];
        let bProxyNode = false;

        // recursive step for sub-graphs (yED sub-groups)
        if (n.graph){
            this.realizeProxyGraphFromJSONNode(n.graph);
            //let subG = this.realizeProxyGraphFromJSONNode(n.graph);
            //if (subG) G.add(subG);
        }

        let type   = this.getNodeType(n);
        let t      = this.getNodeTime(n);
        let fields = this.getNodeFields(n);

        let pid = this.getPeriodIndexFromTime(t);

        if (this.pathproxies && fields.label){
            let periodName = undefined;

            //let periodColor = undefined;
            //let periodTexture = undefined;

            if (this.timeline[pid]){
                periodName = this.timeline[pid].name;
                //if (this.timeline[pid].tex) periodTexture = this.timeline[pid].tex;
                //if (this.timeline[pid].color) periodColor = this.timeline[pid].color;
                ////console.log(periodName,periodColor);
            }

            // Single proxy
            if (type === EMVIQ.NODETYPES.SPECIALFIND 
                || type === EMVIQ.NODETYPES.US 
                || type === EMVIQ.NODETYPES.USVN 
                || type === EMVIQ.NODETYPES.USVS ){
                bProxyNode = true;
                
                if (periodName){
                    //console.log(fields.label);

                    let semNode = ATON.createSemanticNode(fields.label).load(this.pathproxies+fields.label+".gltf");                    
                    semNode.setDefaultAndHighlightMaterials( EMVIQ.matProxyOFF[type], EMVIQ.matProxyON[type] );
                    semNode.setMaterial(EMVIQ.matProxyOFF[type]);
                    semNode.attachTo(periodName);

                    // Store inside SemNode
                    let EMdata = EMUtils.getOrCreateEMData(semNode);
                    EMdata.isProxy = true;
                    EMdata.type = type;
                    EMdata.time = t;
                    EMdata.period = periodName;
                    EMdata.periods[periodName] = true;
                    
                    EMdata.description = fields.description;
                    EMdata.url = fields.url;

                    this.proxyNodes[fields.label] = semNode;
                }
            }

            // Procedural proxy
            // TODO:
            /*
            if (type === EMVIQ.NODETYPES.SERIATION){
                bProxyNode = true;

                if (periodName){

                    let procp = ATON.createDescriptorProductionFromASCII(
                        this.pathproxies + fields.label + "_m.osgjs",
                        this.pathproxies + fields.label + "-inst.txt"
                        ).as(fields.label);

                    procp.attachTo(periodName);
                }
            }
            */

/*
            if (bProxyNode){
                let pkey = fields.label;

                this.proxyNodes[pkey] = {};
                this.proxyNodes[pkey].type = type;
                this.proxyNodes[pkey].time = t;
                this.proxyNodes[pkey].periodName = periodName;

                if (fields.description) this.proxyNodes[pkey].description = fields.description;
                if (fields.url) this.proxyNodes[pkey].url = fields.url;

                //console.log(this.proxyNodes[pkey]);

                ////let P = ATON.addParentToDescriptor(pkey, periodName );
            }
*/
            // If accepted, push into EM nodes
            if (type && periodName && fields.xmlID){
                let EMkey = fields.xmlID;

                this.EMnodes[EMkey] = new EMNode();
                this.EMnodes[EMkey].type = type;
                this.EMnodes[EMkey].time = t;
                this.EMnodes[EMkey].period = periodName;

                this.EMnodes[EMkey].label = fields.label;
                this.EMnodes[EMkey].description = fields.description;
                this.EMnodes[EMkey].url = fields.url;

/*
                this.EMnodes[EMkey] = new THREE.Group();
                this.EMnodes[EMkey].userData.EM = {};
                //let EMdata = this.EMnodes[EMkey]._EMdata;

                this.EMnodes[EMkey].userData.EM.type = type;
                this.EMnodes[EMkey].userData.EM.time = t;
                this.EMnodes[EMkey].userData.EM.periodName = periodName;
                if (fields.label)       this.EMnodes[EMkey].userData.EM.label = fields.label;
                if (fields.description) this.EMnodes[EMkey].userData.EM.description = fields.description;
                if (fields.url)         this.EMnodes[EMkey].userData.EM.url = fields.url;
*/

                //console.log(this.EMnodes[EMkey].userData.EM);
            }
        }

        //console.log(this.EMnodes);
    }

    //return G;
}

// Build EM nodes relationships
buildEMgraph(graphnode){
    if (!graphnode) graphnode = this._mainGMLRoot;

    //console.log(graphnode);
    if (!graphnode.edge) return; // no edges found in GraphML

    let numEdges = graphnode.edge.length;
    for (let i = 0; i < numEdges; i++){
        let E = graphnode.edge[i];
        if (E){
            let sourceID = String(this.getAttribute(E,"source"));
            let targetID = String(this.getAttribute(E,"target"));

            let sourceNode = this.EMnodes[sourceID];
            let targetNode = this.EMnodes[targetID];

            if (sourceNode !== undefined && targetNode !== undefined){
                sourceNode.addChild(targetNode);
                //if (sourceNode._EMdata.type === ATON.emviq.NODETYPES.CONTINUITY) console.log(sourceNode._EMdata);
                }
            //console.log(sourceID+" > "+targetID);
            }
        }
}

// Check
buildContinuity(){
    for (let n in this.EMnodes){
        let N = this.EMnodes[n];

        if (N.type === EMVIQ.NODETYPES.CONTINUITY){
            let T = N.children[0];
            let iend = this.getPeriodIndexFromName(N.period);

            if (T && iend){
                let istart = this.getPeriodIndexFromName(T.period);
                //console.log(T);
                //console.log(istart,iend);

                let proxyid = T.label;

                for (let p = (istart+1); p <= iend; p++) {
                    let period = this.timeline[p].name;

                    let semNode = ATON.getSemanticNode(proxyid);

                    let EMdata = semNode.userData.EM;
                    EMdata.periods[period] = true;
                    
                    //ATON.getDescriptor(period).add(proxyid);
                    //let proxClone = ATON.getSemanticNode(proxyid).clone();
                    //console.log(proxClone);
                    //proxClone.attachTo(period);
                }
            }
        }
    }
}

buildRec(){
    for (let p in this.timeline){
        let pname = this.timeline[p].name;

        let pnamerec = pname+" Rec";

        let currGroup = ATON.getSemanticNode(pname);
        let recGroup  = ATON.getSemanticNode(pnamerec);

        if (currGroup && recGroup){
            for (let c in currGroup.children){
                //recGroup.add(currGroup.children[c]);
                let proxNode = currGroup.children[c];

                let EMdata = proxNode.userData.EM;
                EMdata.periods[pnamerec] = true;
                //EMUtils.assignProxyNodeToPeriod(proxNode, pnamerec);
            }
        }
    }
}

};