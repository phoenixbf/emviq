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

    EMVIQ.materials   = [];
    EMVIQ.materialsHL = [];

    for (let i in EMVIQ.colors){
        EMVIQ.materials.push(
            new THREE.MeshStandardMaterial({
                color: EMVIQ.colors[i], 
                transparent: true,
                depthWrite: false, 
                opacity: 0.0, //0.2,
                flatShading: true,
                //polygonOffset: true,
                //polygonOffsetFactor: -1,
                //polygonOffsetUnits: 1,
                //renderOrder: 2
            })
        );

        EMVIQ.materialsHL.push(
            new THREE.MeshStandardMaterial({
                color: EMVIQ.colors[i], 
                transparent: true,
                depthWrite: false, 
                opacity: 0.4,
                flatShading: true,
                //polygonOffset: true,
                //polygonOffsetFactor: -1,
                //polygonOffsetUnits: 1,
                //renderOrder: 2
            })
        );
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
    EMVIQ.bShowAllProxies = false;


    EMVIQ.buildColorPalette();

    ATON.FE.setupBasicUISounds();
    EMVIQ.setupUI();
    EMVIQ.setupSUI();
    EMVIQ.setupEventHandlers();

    EMVIQ.run();
};

EMVIQ.run = ()=>{
    if (EMVIQ.paramSID === undefined) return;

    // Load scene
    ATON.FE.loadSceneID(EMVIQ.paramSID);

    EMVIQ.currEM = new EMVIQ.EM(ATON.PATH_SCENES+EMVIQ.paramSID);
    EMVIQ.currEM.parseGraphML(()=>{
        EMVIQ.currEM.realizeProxyGraphFromJSONNode();
        EMVIQ.currEM.buildEMgraph();

        document.getElementById("idTimeline").setAttribute("max", EMVIQ.currEM.timeline.length-1);

        //EMVIQ.currPeriodName = EMVIQ.currEM.timeline[0].name;
        //console.log(EMVIQ.currPeriodName);
    });

    //ATON.Nav.setFirstPersonControl();

};


// HTML UI
EMVIQ.setupUI = ()=>{
    ATON.FE.uiAddButtonFullScreen("idTopToolbar");
	ATON.FE.uiAddButtonHome("idBottomIcons");
    ATON.FE.uiAddButtonQR("idTopToolbar");

    ATON.FE.uiAddButtonVR("idTopToolbar"); // VR button will show up only on secure connections (required)
    ATON.FE.uiAddButtonDeviceOrientation("idTopToolbar");


    let htmlTimeline = "<h3 id='idPeriodName' class='emviqPeriod'>Timeline</h3>";
    htmlTimeline += "<input id='idTimeline' type='range' min='0' max='1' >";
    $("#idTimelineContainer").html(htmlTimeline);
    $("#idTimeline").on("input change",()=>{
        let i = $("#idTimeline").val();
        EMVIQ.filterByPeriodIndex( i );
    });

    EMVIQ.setupSearchUI();
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
        ATON._bPauseQuery = true;
        ATON.SUI.infoNode.visible = false;
        //ATON.FE.popupClose();
        });
    $('#idSearch').blur(()=>{ 
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

    //if (ATON.Utils.isMobile() && !ATON.XR.isPresenting()) ATON.SUI.bShowInfo = false;
};


// Our events
EMVIQ.setupEventHandlers = ()=>{
    ATON.FE.addBasicLoaderEvents();

    //ATON.clearEventHandlers("SemanticNodeLeave");
    //ATON.clearEventHandlers("SemanticNodeHover");
    ATON.on("SemanticNodeHover", (semid)=>{
        EMVIQ.updateQueriedProxyInfo(semid);
        //ATON.FE.auLib.switch.play();
    });
    ATON.on("SemanticNodeLeave", (semid)=>{
        $("#idProxyID").html("");
    });

    ATON.on("AllNodeRequestsCompleted",()=>{
        EMVIQ.highlightFirstValidPeriod();

        EMVIQ.currEM.buildContinuity();
        EMVIQ.currEM.buildRec();
    });

    ATON.on("XRmode", (b)=>{
        EMVIQ.suiDescBlock.visible = b;
    });

    ATON.on("KeyPress",(k)=>{
        if (k === "x") EMVIQ.popupTest();
    });
};

EMVIQ.highlightFirstValidPeriod = ()=>{
    for (let i = 0; i < EMVIQ.currEM.timeline.length; i++) {
        let period = EMVIQ.currEM.timeline[i];
        
        let gPeriod = ATON.getSceneNode(period.name);
        if (gPeriod /*&& gPeriod.hasValidBounds()*/){
            EMVIQ.filterByPeriodIndex(i);
            return;
        }
    }

    console.log("NO VALID RMs");
    EMVIQ.bShowAllProxies = true;
    EMVIQ.filterByPeriodIndex(0);
};


EMVIQ.highlightProxies = function(idlist){
    let numHL = idlist.length;

    for (let d in EMVIQ.currEM.proxyNodes){
        let proxy = EMVIQ.currEM.proxyNodes[d];
        let did = proxy.nid;

        if (!EMVIQ.bShowAllProxies) proxy.restoreDefaultMaterial();
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

    if (!EMVIQ.bShowAllProxies){
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

    $("#idTimeline").val(i);

    //EMVIQ.currPeriodIndex = i;
    EMVIQ.filterByPeriodName(period.name);
};

EMVIQ.blurProxiesCurrPeriod = function(){
    let proxiesGroup = ATON.getSemanticNode(EMVIQ.currPeriodName);
    if (!proxiesGroup) return;

    let numProxies = proxiesGroup.children.length;
    for (let d = 0; d < numProxies; d++){
        let D = proxiesGroup.children[d];

        if (!EMVIQ.bShowAllProxies) D.restoreDefaultMaterial();
    }
};

EMVIQ.updateQueriedProxyInfo = function(did){
    // First check if it's a EM proxy
    let proxy = EMVIQ.currEM.proxyNodes[did];
    if (!proxy) return;

    // HTML UI
    let EMdata = proxy.userData.EM;
    let content = "<span style='font-size:32px;'>"+did+"</span><br>";
    if (EMdata.description) content += EMdata.description;
    
    //content += "<br><i>";
    //for (let p in EMdata.periods) content += p+"<br>";
    //content += "</i>";

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
};

// TODO:
EMVIQ.popupSettings = ()=>{
    let htmlcontent = "<h1>Settings</h1>";
    //htmlcontent += ;

    if ( !ATON.FE.popupShow(htmlcontent) ) return;
};

EMVIQ.popupMatches = ()=>{
    let num = EMVIQ.sematches.length;
    if (num <= 0) return;

    let htmlcontent = "<div style='height: 50% !important;'>";
    htmlcontent += "<h1>"+num+" Matches</h1>";
    
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
