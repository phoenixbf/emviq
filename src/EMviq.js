/*!
    @preserve

 	EMviq

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
'use strict';

/**
@namespace EMVIQ
*/
let EMVIQ = {};
window.EMVIQ = EMVIQ;

import EM from "./EM.js";

EMVIQ.EM = EM;

EMVIQ.YED_dNodeGraphics = "d6";
EMVIQ.YED_dEdgeGraphics = "d10";
EMVIQ.YED_dAttrDesc     = "d5";
EMVIQ.YED_dAttrURL      = "d4";

EMVIQ.YED_sSeriation = "ellipse";          // USV Series
EMVIQ.YED_sUS        = "rectangle";        // SU (or US)
EMVIQ.YED_sUSVS      = "parallelogram";    // Structural Virtual SU
EMVIQ.YED_sUSVN      = "hexagon";          // Non-structural Virtual SU
EMVIQ.YED_sSF        = "octagon";          // (virtual) special find

EMVIQ.NODETYPES = {
    SERIATION:0,
    US:1,
    USVS:2,
    USVN:3,
    SPECIALFIND:4,

    COMBINER:5,
    EXTRACTOR:6,
    DOCUMENT:7,
    PROPERTY:8,
    CONTINUITY:9
};

EMVIQ.getIconURLbyType = (type)=>{
    if (type === EMVIQ.NODETYPES.SERIATION) return "res/emicons/SUseries.png";
    if (type === EMVIQ.NODETYPES.US) return "res/emicons/US.png";
    if (type === EMVIQ.NODETYPES.USVS) return "res/emicons/USVs.png";
    if (type === EMVIQ.NODETYPES.USVN) return "res/emicons/USVn.png";
    if (type === EMVIQ.NODETYPES.SPECIALFIND) return "res/emicons/SF.png";

    if (type === EMVIQ.NODETYPES.COMBINER) return "res/emicons/combiner.png";
    if (type === EMVIQ.NODETYPES.EXTRACTOR) return "res/emicons/extractor.png";
    if (type === EMVIQ.NODETYPES.DOCUMENT) return "res/emicons/document.png";
    if (type === EMVIQ.NODETYPES.PROPERTY) return "res/emicons/property.png";
    if (type === EMVIQ.NODETYPES.CONTINUITY) return "res/emicons/continuity.png";

    return "";
};

EMVIQ.x2js = new X2JS({attributePrefix:"@"});

EMVIQ.buildColorPalette = ()=>{
    EMVIQ.colors = [];

    let gm = 4.0; // multiplier corrections
    let rm = 2.0;

    let gcol = new THREE.Color(0.031*gm, 0.191*gm, 0.026*gm)
    let rcol = new THREE.Color(0.328*rm, 0.033*rm, 0.033*rm)

    EMVIQ.colors.push( gcol ); // SERIATION
    EMVIQ.colors.push( rcol ); // US
    EMVIQ.colors.push( new THREE.Color(0.018, 0.275, 0.799) ); // USVN
    EMVIQ.colors.push( gcol ); // USVS
    EMVIQ.colors.push( new THREE.Color(0.799, 0.753, 0.347) ); // SF

    EMVIQ.matProxyOFF = [];
    EMVIQ.matProxyON  = [];

    for (let i in EMVIQ.colors){
        EMVIQ.matProxyOFF.push(
            new THREE.MeshStandardMaterial({
                color: EMVIQ.colors[i], 
                transparent: true,
                depthWrite: false, 
                opacity: 0.0, //0.2,
                //flatShading: true,
                depthTest: true,
                //side: THREE.DoubleSide
                //polygonOffset: true,
                //polygonOffsetFactor: -1,
                //polygonOffsetUnits: 1,
                //renderOrder: 2
            })
        );

        EMVIQ.matProxyON.push(
            new THREE.MeshStandardMaterial({
                color: EMVIQ.colors[i], 
                transparent: true,
                depthWrite: false, 
                opacity: 0.4,
                //flatShading: true,
                depthTest: true,
                //side: THREE.DoubleSide
                //polygonOffset: true,
                //polygonOffsetFactor: -1,
                //polygonOffsetUnits: 1,
                //renderOrder: 2
            })
        );
    }
};

EMVIQ.setProxiesOpacity = (f)=>{
    for (let m in EMVIQ.matProxyOFF){
        EMVIQ.matProxyOFF[m].opacity = f;
        EMVIQ.matProxyON[m].opacity  = (f+0.1);
    }
};

EMVIQ.setProxiesAlwaysVisible = (b)=>{
    EMVIQ._bProxiesAlwaysVis = b;

    for (let m in EMVIQ.matProxyOFF){
        EMVIQ.matProxyOFF[m].depthTest = !b;
        EMVIQ.matProxyON[m].depthTest  = !b;
    }
};


EMVIQ.init = ()=>{

    // Realize the base front-end
    ATON.FE.realize();

    EMVIQ.paramSID   = ATON.FE.urlParams.get('s');
    EMVIQ.paramDDens = ATON.FE.urlParams.get('d');
    //EMVIQ.paramVRC   = ATON.FE.urlParams.get('vrc');
    //EMVIQ.paramEdit  = ATON.FE.urlParams.get('edit');

    EMVIQ.currPeriodName  = undefined;
    EMVIQ._bShowAllProxies = false;


    EMVIQ.buildColorPalette();

    ATON.FE.setupBasicUISounds();
    EMVIQ.setupUI();
    EMVIQ.setupSUI();
    EMVIQ.setupEventHandlers();

    EMVIQ.run();
};

EMVIQ.run = ()=>{
    if (EMVIQ.paramSID === undefined || EMVIQ.paramSID === null) return;

    // Load scene
    ATON.FE.loadSceneID(EMVIQ.paramSID);

    // Load EM
    EMVIQ.loadEM( ATON.PATH_SCENES + EMVIQ.paramSID );
};

EMVIQ.loadEM = (url, bReload)=>{
    ATON._rootSem.removeChildren();

    EMVIQ.currEM = new EMVIQ.EM(url);
    EMVIQ.currEM.parseGraphML(()=>{
        EMVIQ.currEM.realizeProxyGraphFromJSONNode();
        EMVIQ.currEM.buildEMgraph();

        //document.getElementById("idTimeline").setAttribute("max", EMVIQ.currEM.timeline.length-1);
        EMVIQ.buildTimelineUI();

        //EMVIQ.currPeriodName = EMVIQ.currEM.timeline[0].name;
        //console.log(EMVIQ.currPeriodName);

        if (bReload){
            EMVIQ.currEM.buildContinuity();
            EMVIQ.currEM.buildRec();

            //let i = $("#idTimeline").val();
            //EMVIQ.filterByPeriodIndex( i );

            //EMVIQ.filterByPeriodIndex(EMVIQ.currPeriodIndex);
            //EMVIQ.uiSetPeriodIndex(EMVIQ.currPeriodIndex);
            EMVIQ.goToPeriod(EMVIQ.currPeriodIndex);
        }
    });
};


// HTML UI
EMVIQ.setupUI = ()=>{
    ATON.FE.uiAddButtonFullScreen("idTopToolbar");
	ATON.FE.uiAddButtonHome("idBottomIcons");
    ATON.FE.uiAddButton("idTopToolbar","settings", EMVIQ.popupSettings, "EMviq Settings");
    ATON.FE.uiAddButton("idTopToolbar","res/em.png", ()=>{
        EMVIQ.loadEM( ATON.PATH_SCENES + EMVIQ.paramSID, true );
    }, "Reload Extended Matrix");

    ATON.FE.uiAddButtonQR("idTopToolbar");

    //ATON.FE.uiAddButtonVR("idTopToolbar"); // VR button will show up only on secure connections (required)
    //ATON.FE.uiAddButtonDeviceOrientation("idTopToolbar");

/*
    let htmlTimeline = "<h3 id='idPeriodName' class='emviqPeriod'>Timeline</h3><br>";
    htmlTimeline += "<input id='idTimeline' type='range' min='0' max='1' >";
    $("#idTimelineContainer").html(htmlTimeline);
    $("#idTimeline").on("input change",()=>{
        let i = $("#idTimeline").val();
        EMVIQ.filterByPeriodIndex( i );
    });
*/
    EMVIQ.setupSearchUI();
};

EMVIQ.uiSetPeriodIndex = (i)=>{
    $("#tp"+i).siblings().removeClass('emviqPeriodSelected');
    $("#tp"+i).addClass("emviqPeriodSelected");
};

EMVIQ.buildTimelineUI = ()=>{
    let htmlcontent = "";

    EMVIQ.suiPeriodsBTNs = [];

    for (let i=0; i<EMVIQ.currEM.timeline.length; i++){
        let tp = EMVIQ.currEM.timeline[i];

        let st = undefined;
        if (tp.color) st = "background-color:rgba("+(tp.color.r*255)+", "+(tp.color.g*255)+", "+(tp.color.b*255)+", 0.4)";
        
        if (st) htmlcontent += "<div class='emviqPeriodSelector' style='"+st+"' id='tp"+i+"'>"+tp.name+"</div>";
        else htmlcontent += "<div class='emviqPeriodSelector' id='tp"+i+"'>"+tp.name+"</div>";

        // SUI
        let suiBTN = new ATON.SUI.Button("sui_"+tp.name, 3.0, 1.5);
        suiBTN.onSelect = ()=>{
            //EMVIQ.filterByPeriodIndex(i);
            //EMVIQ.uiSetPeriodIndex(i);
            EMVIQ.goToPeriod(i);
        };

        suiBTN.setPosition(0, i*0.35, 0);
        suiBTN.setScale(3.0);

        suiBTN.setText(tp.name);

        if (tp.color) suiBTN.setBaseColor(tp.color);
        suiBTN.setBackgroundOpacity(0.3);
        
        EMVIQ.suiPeriodsBTNs.push(suiBTN);
    }

    let numPeriods = EMVIQ.suiPeriodsBTNs.length;

    if (numPeriods > 0){
        const pi2 = (Math.PI * 0.5);

        EMVIQ.suiTimeline.removeChildren();
        
        EMVIQ.suiTimeline
            .setPosition(-0.1, 0, 0.1)
            .setRotation(-pi2,-pi2,pi2)
            .setScale(0.1);

        for (let i=0; i<numPeriods; i++) EMVIQ.suiPeriodsBTNs[i].attachTo(EMVIQ.suiTimeline);
    
        EMVIQ.suiTimeline.attachToRoot();
        EMVIQ.suiTimeline.hide();

        /*
        EMVIQ.suiToolbar = ATON.SUI.createToolbar( suiToolbar );
        EMVIQ.suiToolbar.setPosition(-0.1,0,0.1).setRotation(-pi2,-pi2,pi2).setScale(0.3);
    
        EMVIQ.suiToolbar.attachToRoot();
        EMVIQ.suiToolbar.hide();
        */
    }

    $("#idTL").html(htmlcontent);

    for (let i=0; i<EMVIQ.currEM.timeline.length; i++){
        let tp = EMVIQ.currEM.timeline[i];
        $("#tp"+i).click(()=>{
            //EMVIQ.filterByPeriodIndex(i);
            //EMVIQ.uiSetPeriodIndex(i);
            EMVIQ.goToPeriod(i);
        });
    }
    
};

EMVIQ.setupSearchUI = function(){
    let elSearch = document.getElementById( "idSearch" );
    //elSearch.addEventListener( 'keydown', (e)=>{ e.stopPropagation(); }, false );

    $('#idSearch').on('keyup', ()=>{
        let string = $('#idSearch').val();
        //ATON.SUI.infoNode.visible = false;
        EMVIQ.search(string);
    });

    $('#idSearch').focus(()=>{
        ATON._bListenKeyboardEvents = false;
        ATON._bPauseQuery = true;
        ATON.SUI.infoNode.visible = false;
        //ATON.FE.popupClose();
        });
    $('#idSearch').blur(()=>{
        ATON._bListenKeyboardEvents = true;
        if (ATON.FE._bPopup) ATON._bPauseQuery = false;
    });

    $("#idSearchMatches").hide();
};

// Spatial UI
EMVIQ.setupSUI = ()=>{
    let I = ATON.SUI.getInfoNode();

    EMVIQ.suiDescBlock = new ThreeMeshUI.Block({
        width: 0.2,
        height: 0.05,
        padding: 0.01,
        borderRadius: 0.01,
        backgroundColor: ATON.MatHub.colors.white,
        //backgroundOpacity: 0.2,

        fontFamily: ATON.PATH_RES+"fonts/custom-msdf.json", //ATON.PATH_MODS+'three-mesh-ui/examples/assets/Roboto-msdf.json',
        fontTexture: ATON.PATH_RES+"fonts/custom.png", //ATON.PATH_MODS+'three-mesh-ui/examples/assets/Roboto-msdf.png',

        alignContent: 'left', // could be 'center' or 'left'
        justifyContent: 'center', // could be 'center' or 'start'

        interLine: 0.003
    });

    EMVIQ.suiDescBlock.position.set(0,-0.05, 0);

    EMVIQ.suiDescText = new ThreeMeshUI.Text({ 
        content: "...",
        fontSize: 0.01,
        fontColor: ATON.MatHub.colors.black
    });
    EMVIQ.suiDescBlock.add(EMVIQ.suiDescText);

    ATON.SUI.infoNode.add(EMVIQ.suiDescBlock);
    EMVIQ.suiDescBlock.visible = false;

    EMVIQ.suiTimeline = ATON.createUINode();
    EMVIQ.suiPeriodsBTNs = [];

    //if (ATON.Utils.isMobile() && !ATON.XR.isPresenting()) ATON.SUI.bShowInfo = false;
};


// Our events
EMVIQ.setupEventHandlers = ()=>{
    ATON.FE.addBasicLoaderEvents();

    //ATON.clearEventHandlers("SemanticNodeLeave");
    //ATON.clearEventHandlers("SemanticNodeHover");
    ATON.on("SemanticNodeHover", (semid)=>{
        EMVIQ.updateQueriedProxyInfo(semid);

        if (EMVIQ._bShowAllProxies) return;

        let S = ATON.getSemanticNode(semid);
        if (S) S.highlight();
    });
    ATON.on("SemanticNodeLeave", (semid)=>{
        $("#idProxyID").html("");

        if (EMVIQ._bShowAllProxies) return;

        let S = ATON.getSemanticNode(semid);
        if (S) S.restoreDefaultMaterial();
    });

    ATON.on("AllNodeRequestsCompleted",()=>{
        EMVIQ.highlightFirstValidPeriod();

        EMVIQ.currEM.buildContinuity();
        EMVIQ.currEM.buildRec();

        ATON.SUI.setSelectorRadius(0.1);
    });

    ATON.on("XRmode", (b)=>{
        EMVIQ.suiDescBlock.visible = b;
        if (b) ATON.FE.popupClose();
    });

    // Immersive Sessions
    ATON.on("XRcontrollerConnected", (c)=>{
        if (c === ATON.XR.HAND_L){
            ATON.XR.controller1.add( EMVIQ.suiTimeline );
            EMVIQ.suiTimeline.show();
        }

        ThreeMeshUI.update();
    });

    ATON.on("KeyPress",(k)=>{
        //if (k === 'x') EMVIQ.popupTest();
        if (k === 'm') EMVIQ.measure();

        if (k === 'x') ATON._bPauseQuery = !ATON._bPauseQuery;
    });
};

EMVIQ.measure = ()=>{
    let P = ATON.getSceneQueriedPoint();
    let M = ATON.SUI.addMeasurementPoint( P );
};

EMVIQ.highlightFirstValidPeriod = ()=>{
    for (let i = 0; i < EMVIQ.currEM.timeline.length; i++) {
        let period = EMVIQ.currEM.timeline[i];
        
        let gPeriod = ATON.getSceneNode(period.name);
        if (gPeriod /*&& gPeriod.hasValidBounds()*/){
            //EMVIQ.filterByPeriodIndex(i);
            //EMVIQ.uiSetPeriodIndex(i);
            EMVIQ.goToPeriod(i);
            return;
        }
    }

    console.log("NO VALID RMs");
    EMVIQ.showAllProxies(true);

    //EMVIQ.filterByPeriodIndex(0);
    //EMVIQ.uiSetPeriodIndex(0);
    EMVIQ.goToPeriod(0);
};

EMVIQ.showAllProxies = (b)=>{
    EMVIQ._bShowAllProxies = b;

    for (let d in EMVIQ.currEM.proxyNodes){
        let proxy = EMVIQ.currEM.proxyNodes[d];
        if (b){
            proxy.show();
            proxy.highlight();
        }
        else proxy.restoreDefaultMaterial();
    }
}


EMVIQ.highlightProxies = function(idlist){
    let numHL = idlist.length;

    for (let d in EMVIQ.currEM.proxyNodes){
        let proxy = EMVIQ.currEM.proxyNodes[d];
        let did = proxy.nid;

        if (!EMVIQ._bShowAllProxies) proxy.restoreDefaultMaterial();
        //D.hide();

        for (let i = 0; i<numHL; i++){
            if (did === idlist[i]){
                proxy.highlight();
                //D.show();
                //console.log("xxx");
            } 
        }
    }
}

EMVIQ.filterByPeriodName = function(periodname){
    $('#idPeriodName').html(periodname);
    
    EMVIQ.currPeriodName = periodname;

    EMVIQ.currEM.timeline.forEach(p => {
        let rmGroup    = ATON.getSceneNode(p.name);
        //let proxyGroup = ATON.getSemanticNode(p.name);

        if (p.name === periodname){
            if (rmGroup) rmGroup.show();
            //if (proxyGroup) proxyGroup.show();
        }
        else {
            if (rmGroup) rmGroup.hide();
            //if (proxyGroup) proxyGroup.hide();
        }
        //console.log(p.name);
    });

    if (!EMVIQ._bShowAllProxies){
        for (let p in EMVIQ.currEM.proxyNodes){
            let P = EMVIQ.currEM.proxyNodes[p];
            let EMdata = P.userData.EM;

            if (EMdata.periods[periodname] !== undefined){
                P.show();
                //P.parent.visible = true;
            }
            else P.hide();
        }
    }

    EMVIQ.highlightProxies([]);
};

// By index
EMVIQ.filterByPeriodIndex = function(i){
    let period = EMVIQ.currEM.timeline[i];
    if (!period) return;

    //$("#idTimeline").val(i);

    EMVIQ.currPeriodIndex = i;
    EMVIQ.filterByPeriodName(period.name);
};

EMVIQ.goToPeriod = (i)=>{
    EMVIQ.filterByPeriodIndex(i);
    EMVIQ.uiSetPeriodIndex(i);

    if (EMVIQ.suiTimeline){
        for (let k=0; k<EMVIQ.suiPeriodsBTNs.length; k++){
            let B = EMVIQ.suiPeriodsBTNs[k];

            if (k===i) B.setBackgroundOpacity(0.9);
            else B.setBackgroundOpacity(0.3);
        }
    }
};

EMVIQ.blurProxiesCurrPeriod = function(){

    for (let p in EMVIQ.currEM.proxyNodes){
        let proxy = EMVIQ.currEM.proxyNodes[p];
        let EMdata = proxy.userData.EM;

        if (EMdata.periods[EMVIQ.currPeriodName] !== undefined) proxy.restoreDefaultMaterial();
    }

/*
    let proxiesGroup = ATON.getSemanticNode(EMVIQ.currPeriodName);
    if (!proxiesGroup) return;

    let numProxies = proxiesGroup.children.length;
    for (let d = 0; d < numProxies; d++){
        let D = proxiesGroup.children[d];

        if (!EMVIQ._bShowAllProxies) D.restoreDefaultMaterial();
    }
*/
};

EMVIQ.getSourceGraphHTML = (emn)=>{
    if (emn.children.lenght<1) return "";

    let html = "";

    for (let e in emn.children){
        let E = emn.children[e];

        //console.log(E)

        // Entry title
        html += "<details class='emviqSGEntry'><summary class='emviqSNTitle'><img src='"+EMVIQ.getIconURLbyType(E.type)+"'>"+E.label+"</summary>";

        // Show here entry attributes
        if (E.description) html += "<b>Description: </b>"+ E.description + "<br><br>";
        if (E.period) html += "<b>Period: </b>"+ E.period + "<br><br>";
        if (E.url) html += "<a href="+ E.url + "><img src="+ E.url + " width='250' height='250' vertical-align='middle'></a><br>";
        
        // Recurse
        html += EMVIQ.getSourceGraphHTML(E);
        html += "</details>";
    };

    return html;
};

EMVIQ.updateQueriedProxyInfo = function(did){
    // First check if it's a EM proxy
    let proxy = EMVIQ.currEM.proxyNodes[did];
    if (!proxy) return;

    // HTML UI
    let EMdata = proxy.userData.EM;   
    let content = "<span style='font-size:32px;'>"+did+"</span><br>";
    
    if (EMdata.description) content += EMdata.description+"</br>";
    content += "<img style='width:100px;height:auto' src='"+EMVIQ.getIconURLbyType(EMdata.type)+"'></img><br>";

    // Retrieve root of source-graphs
    const emn = EMVIQ.currEM.getSourceGraphByProxyID(did);

    content += "<div class='emviqSG'>"+EMVIQ.getSourceGraphHTML(emn)+"</div>";  
   
   $("#idProxyID").html(content);

    // SUI
    EMVIQ.suiDescText.set({ content: EMdata.description });
};

    
// Search
EMVIQ.search = function(string){
    if (string.length < 2){
        EMVIQ.blurProxiesCurrPeriod();
        $("#idSearchMatches").hide();
        //EMVIQ.switchInfoNode(false);
        return;
    }

    string = string.toLowerCase();

    EMVIQ.sematches  = [];
    let aabbProxies = new THREE.Box3(); // cumulative BS

    for (let did in EMVIQ.currEM.proxyNodes){
        let bAdd = false;

        let didstr = did.toLowerCase();
        let D = ATON.getSemanticNode(did);
        let proxy = EMVIQ.currEM.proxyNodes[did];
        let EMdata = proxy.userData.EM;

        // Search only for current period
        if (EMdata.periods[EMVIQ.currPeriodName] !== undefined){
            // Matching rules
            // Proxy ID
            if (didstr.startsWith(string)) bAdd = true;

            // Proxy description
            if (proxy && EMdata.description){
                let descrKeys = EMdata.description.split(" ");

                for (let k = 0; k < descrKeys.length; k++){
                    let descrK = descrKeys[k].toLowerCase();

                    if (descrK.startsWith(string)) bAdd = true;
                    //if (descrK.match(string)) bAdd = true;
                }
            }
        }


        if (bAdd){
            EMVIQ.sematches.push(did);
            aabbProxies.expandByObject(D);
            //aabbProxies.expandByBoundingSphere( D.getBoundingSphere() );
            
            //TODO: switch on multiple periods? proxy.periodName
            
            //console.log("MATCH "+did);
        }
    }

    // results
    let len = EMVIQ.sematches.length;
    if (len > 0){
        //console.log(EMVIQ.sematches);
        $("#idProxyID").html("");

        EMVIQ.highlightProxies(EMVIQ.sematches);

        let bsProxies = new THREE.Sphere;
        aabbProxies.getBoundingSphere(bsProxies);
        ATON.Nav.requestPOVbyBound( bsProxies, 0.5 );

        $("#idSearchMatches").html(len);
        $("#idSearchMatches").show();

        //if (len === 1) EMVIQ.focusOnProxy(EMVIQ.sematches[0]);
        //else EMVIQ.switchInfoNode(false);
    }
    else {
        EMVIQ.blurProxiesCurrPeriod();
        $("#idSearchMatches").hide();
        //EMVIQ.switchInfoNode(false);
    }
}

EMVIQ.searchClear = function(){
    $('#idSearch').val('');
    $("#idSearchMatches").hide();
    
    ATON._bPauseQuery = false;
    EMVIQ.blurProxiesCurrPeriod();
};

// Settings popup
EMVIQ.popupSettings = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Settings</div>";
    let blblock = "<div style='max-width:300px; display:inline-block; margin:5px; vertical-align:top;'>";

    //htmlcontent += "<div class='atonBlockGroup'><h3>Navigation</h3>";
    htmlcontent += "<div id='idNavModes'></div><br>";

    htmlcontent += "<div class='atonBlockGroup' style='text-align:left;'><h3>Proxies</h3>";
    htmlcontent += blblock+"<input id='idConfigOcclusion' type='checkbox'><b>Occlusion</b>"; // <div style='white-space: nowrap;'>
    htmlcontent += "<br>Uses visible 3D representations to occlude queries on proxies</div>";

    htmlcontent += blblock+"<input id='idConfigProxiesAlwaysVis' type='checkbox'><b>Always visible</b>";
    htmlcontent += "<br>Proxies are always visible on top of visible 3D representation models</div>";

    htmlcontent += blblock+"<input id='idConfigShowAllProxies' type='checkbox'><b>Show All</b>";
    htmlcontent += "<br>Show all proxies</div><br>";

    //htmlcontent += "<input id='idProxiesOpacity' type='range' min='0' max='1' step='0.1' ><label for='idProxiesOpacity'>Proxies opacity</label>";
    htmlcontent += "</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    ATON.FE.uiAddButtonFirstPerson("idNavModes");
    ATON.FE.uiAddButtonDeviceOrientation("idNavModes");
    ATON.FE.uiAddButtonVR("idNavModes");

    $("#idConfigOcclusion").prop('checked', ATON._bQuerySemOcclusion);
    $("#idConfigShowAllProxies").prop('checked', EMVIQ._bShowAllProxies);
    $("#idConfigProxiesAlwaysVis").prop('checked', EMVIQ._bProxiesAlwaysVis);

    $("#idConfigOcclusion").on("change", ()=>{
        ATON._bQuerySemOcclusion = $("#idConfigOcclusion").is(":checked");
    });
    $("#idConfigShowAllProxies").on("change",()=>{
        let b = $("#idConfigShowAllProxies").is(":checked");
        EMVIQ.showAllProxies(b);
    });
    $("#idConfigProxiesAlwaysVis").on("change",()=>{
        let b = $("#idConfigProxiesAlwaysVis").is(":checked");
        EMVIQ.setProxiesAlwaysVisible(b);
    });

    $("#idProxiesOpacity").on("change", ()=>{
        let f = parseFloat( $("#idProxiesOpacity").val() );
        EMVIQ.setProxiesOpacity(f);
    });

    
};

EMVIQ.popupMatches = ()=>{
    let num = EMVIQ.sematches.length;
    if (num <= 0) return;

    let htmlcontent = "<div style='height: 50% !important;'>";
    htmlcontent += "<div class='atonPopupTitle'>"+num+" Matches</div>";
    
    htmlcontent += "<table>";
    // Header
    htmlcontent += "<thead><tr><th>Proxy ID</th><th>Time</th><th>Description</th><th>URL</th></tr></thead>";
    
    htmlcontent += "<tbody>";
    for (let d = 0; d < num; d++){
        let did   = EMVIQ.sematches[d];
        let proxy = EMVIQ.currEM.proxyNodes[did];
        let EMdata = proxy.userData.EM;

        if (proxy){
            //htmlcontent += "<tr onclick=\"EMVIQ.focusOnProxy(\'"+did+"\')\">";
            htmlcontent += "<tr>";
            htmlcontent += "<td>"+did+"</td>";
            htmlcontent += "<td>"+EMdata.time.toFixed(2)+"</td>";
            htmlcontent += "<td>"+EMdata.description+"</td>";
            if (EMdata.url) htmlcontent += "<td>"+EMdata.url+"</td>";
            else htmlcontent += "<td>/</td>";
            htmlcontent += "</tr>";
            }
        }
    htmlcontent += "</tbody>";
    htmlcontent += "</table>";
    htmlcontent += "</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;


};


// Main init
window.addEventListener( 'load', ()=>{
    EMVIQ.init();
});