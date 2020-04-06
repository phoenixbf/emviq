/*!
    @preserve

    EMviq web-app based on ATON

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

EMVIQ = {};

EMVIQ.PROJECT_FOLDER = "projects/";
EMVIQ.project = undefined;

EMVIQ.currPeriodName = undefined;
EMVIQ.EM = new ATON.emviq.EM();

EMVIQ.dmatches = []; // search descriptor matches

EMVIQ._infotrans = undefined;
EMVIQ._infotext  = undefined;

EMVIQ._bPopup = false;

EMVIQ.bShowAllProxies = false;

EMVIQ._invalidProxies = [];


EMVIQ.setupPage = function(){
    let elSearch = document.getElementById( "idSearch" );
    elSearch.addEventListener( 'keydown', (e)=>{ e.stopPropagation(); }, false );

    $('#idSearch').on('keyup', ()=>{
        let string = $('#idSearch').val();
        EMVIQ.search(string);
        });

    $('#idSearch').focus(()=>{ 
        ATON._bPauseDescriptorQuery = true;
        EMVIQ.switchInfoNode(false);
        EMVIQ.popupClose();
        });
    $('#idSearch').blur(()=>{ 
        if (!EMVIQ._bPopup) ATON._bPauseDescriptorQuery = false;
        });

    $("#idSearchMatches").hide();
};

EMVIQ.toggleFullscreen = function(b){
    if (screenfull.enabled){
        if (b === undefined) screenfull.toggle();
        else {
            if (b) screenfull.request();
            //else
            }
        }
};

EMVIQ.blurProxiesCurrPeriod = function(){
    let proxiesGroup = ATON.getDescriptor(EMVIQ.currPeriodName);
    if (!proxiesGroup) return;

    let numProxies = proxiesGroup.children.length;
    for (let d = 0; d < numProxies; d++){
        let D = proxiesGroup.children[d];

        if (!EMVIQ.bShowAllProxies) D.setStateSet(undefined);
        }
};

EMVIQ.highlightProxies = function(idlist){
    let proxiesGroup = ATON.getDescriptor(EMVIQ.currPeriodName);
    if (!proxiesGroup) return;

    //let period = EMVIQ.EM.getPeriodFromName(EMVIQ.currPeriodName);

    //console.log(dg);
    let numProxies = proxiesGroup.children.length;
    let numHL = idlist.length;

    for (let d = 0; d < numProxies; d++){
        const D = proxiesGroup.children[d];
        let did = D.getUniqueID();

        let proxy  = EMVIQ.EM.proxyNodes[did];
        
        let texcol    = ATON.emviq.nodeTexColors[proxy.type];
        let texcoloff = ATON.emviq.nodeTexColorsOff[proxy.type];
        //if (!texcol) texcol = period.tex;
        //console.log(proxy.type);

        if (!EMVIQ.bShowAllProxies) D.setStateSet(undefined);
        else D.getSS().setTextureAttributeAndModes( 0, texcoloff, osg.StateAttribute.ON | osg.StateAttribute.PROTECTED);

        for (let i = 0; i<numHL; i++){
            if (did === idlist[i]){
                //D.getSS().setTextureAttributeAndModes( 0, period.tex, osg.StateAttribute.ON | osg.StateAttribute.PROTECTED);
                D.getSS().setTextureAttributeAndModes( 0, texcol, osg.StateAttribute.ON | osg.StateAttribute.PROTECTED);
                }
            }
        }
};

// Search
EMVIQ.search = function(string){
    if (string.length < 2){
        EMVIQ.blurProxiesCurrPeriod();
        $("#idSearchMatches").hide();
        EMVIQ.switchInfoNode(false);
        return;
        }

    string = string.toLowerCase();

    //console.log("Searching "+string);

    EMVIQ.dmatches  = [];
    let bsProxies = new osg.BoundingSphere();

    for (let did in ATON.descriptors){
        let bAdd = false;

        let didstr = did.toLowerCase();
        let D = ATON.getDescriptor(did);
        let proxy = EMVIQ.EM.proxyNodes[did];

        // Matching rules
        // Proxy ID
        if (didstr.startsWith(string)) bAdd = true;

        // Proxy description
        if (proxy && proxy.description){
            let descrKeys = proxy.description.split(" ");

            for (k = 0; k < descrKeys.length; k++){
                descrK = descrKeys[k].toLowerCase();

                if (descrK.startsWith(string)) bAdd = true;
                //if (descrK.match(string)) bAdd = true;
                }
            }


        if (bAdd){
            EMVIQ.dmatches.push(did);
            bsProxies.expandByBoundingSphere( D.getBoundingSphere() );
            
            //TODO: switch on multiple periods? proxy.periodName
            
            //console.log("MATCH "+did);
            }
        
        }

    let len = EMVIQ.dmatches.length;
    if (len > 0){
        //console.log(EMVIQ.dmatches);
        $("#idProxyID").html("");

        EMVIQ.highlightProxies(EMVIQ.dmatches);
        ATON.requestPOVbyBound(bsProxies, 2.0, 0.5);

        $("#idSearchMatches").html(len);
        $("#idSearchMatches").show();

        if (len === 1) EMVIQ.focusOnProxy(EMVIQ.dmatches[0]);
        else EMVIQ.switchInfoNode(false);
        }
    else {
        EMVIQ.blurProxiesCurrPeriod();
        $("#idSearchMatches").hide();
        EMVIQ.switchInfoNode(false);
        }
};

EMVIQ.searchClear = function(){
    $('#idSearch').val('');
    $("#idSearchMatches").hide();
    ATON._bPauseDescriptorQuery = false;
};

EMVIQ.popupClose = function(){
    $("#idPopup").hide();
    EMVIQ._bPopup = false;
};

EMVIQ.popupMatches = function(){
    if (EMVIQ._bPopup) return;

    ATON._bPauseDescriptorQuery = true;
    EMVIQ._bPopup = true;

    let num = EMVIQ.dmatches.length;
    if (num <= 0) return;

    let htmlcontent = "<div class='atonPopup' style='height: 50% !important;'>";
    htmlcontent += "<h1>"+num+" Matches</h1>";
    
    htmlcontent += "<table>";
    // Header
    htmlcontent += "<thead><tr><th>Proxy ID</th><th>Time</th><th>Description</th><th>URL</th></tr></thead>";

    htmlcontent += "<tbody>";

    for (let d = 0; d < EMVIQ.dmatches.length; d++){
        let did   = EMVIQ.dmatches[d];
        let proxy = EMVIQ.EM.proxyNodes[did];

        if (proxy){
            htmlcontent += "<tr onclick=\"EMVIQ.focusOnProxy(\'"+did+"\')\">";
            htmlcontent += "<td>"+did+"</td>";
            htmlcontent += "<td>"+proxy.time.toFixed(2)+"</td>";
            htmlcontent += "<td>"+proxy.description+"</td>";
            if (proxy.url) htmlcontent += "<td>"+proxy.url+"</td>";
            else htmlcontent += "<td>/</td>";
            htmlcontent += "</tr>";
            }
        }

    htmlcontent += "</tbody>";
    htmlcontent += "</table>";
    htmlcontent += "</div>";

    $("#idPopup").html(htmlcontent);
    $("#idPopup").show();
};


EMVIQ.logPOV = function(){
    console.log(
        "&pov="+
        ATON._currPOV.pos[0].toFixed(2)+","+
        ATON._currPOV.pos[1].toFixed(2)+","+
        ATON._currPOV.pos[2].toFixed(2)+","+
        ATON._currPOV.target[0].toFixed(2)+","+
        ATON._currPOV.target[1].toFixed(2)+","+
        ATON._currPOV.target[2].toFixed(2)
    );
};

EMVIQ.attachListeners = function(){

    // Custom doubletap
    ATON.clearEventHandlers("DoubleTap");
    ATON.on("DoubleTap", (e)=>{
        if (ATON._hoveredDescriptor) ATON.requestPOVbyDescriptor(ATON._hoveredDescriptor, 0.5);
        else ATON._requestRetarget();
        });

    ATON.clearEventHandlers("KeyPress");
    ATON.on("KeyPress",(k)=>{
        if (k === 'f'){
            if (!ATON._bPauseDescriptorQuery){
                if (ATON._hoveredDescriptor) EMVIQ.focusOnProxy(ATON._hoveredDescriptor);
                }
            else {
                ATON._bPauseDescriptorQuery = false;
                }
            }

        if (k === 'p'){
            console.log(ATON._currPOV.pos, ATON._currPOV.target, ATON._currPOV.fov);
            }
        });

    ATON.on("VRmode", function(v){
        if (v){
            $('#idTopNav').hide();
            $('#idBottomNav').hide();
            $('#idProxyID').hide();

            EMVIQ.popupClose();
            }
        else {
            $('#idTopNav').show();
            $('#idBottomNav').show();
            $('#idProxyID').show();
            }
        });
};

// Lock on proxy
EMVIQ.focusOnProxy = function(d){
    if (!d) return;

    ATON._bPauseDescriptorQuery = true;

    let D = undefined;
    let did = undefined;

    if (typeof d === 'string'){
        D = ATON.getDescriptor(d);
        did = d;
        }
    else {
        D = d;
        did = D.getUniqueID();
        }

    //ATON._hoveredDescriptor = D;

    EMVIQ.highlightProxies([did]);
    
    //EMVIQ.switchInfoNode(false);
    EMVIQ.switchInfoNode(true);
    EMVIQ.updateInfoNodeLocation(D.getBoundingSphere()._center);
    EMVIQ._infotext.setText(did);

    ATON.requestPOVbyDescriptor(did, 0.5);
    EMVIQ.updateProxyHTML(did);
};

EMVIQ.highlightPeriodByName = function(periodname){
    $('#idPeriodName').html(periodname);
    
    EMVIQ.currPeriodName = periodname;

    EMVIQ.EM.timeline.forEach(p => {
        let rmGroup    = ATON.getNode(p.name);
        let proxyGroup = ATON.getDescriptor(p.name);

        if (p.name === periodname){
            if (rmGroup) rmGroup.switch(true);
            if (proxyGroup) proxyGroup.switch(true);
            }
        else {
            if (rmGroup) rmGroup.switch(false);
            if (proxyGroup) proxyGroup.switch(false);
            }
        //console.log(p.name);
        });

    EMVIQ.highlightProxies([]);
    //console.log(ATON.getRootDescriptors());
};

// By index
EMVIQ.highlightPeriodByIndex = function(i){
    let period = EMVIQ.EM.timeline[i];
    if (!period) return;

    $("#idTimeline").val(i);

    //EMVIQ.currPeriodIndex = i;
    EMVIQ.highlightPeriodByName(period.name);
};

EMVIQ.highlightFirstValidPeriod = function(){
    for (let i = 0; i < EMVIQ.EM.timeline.length; i++) {
        let period = EMVIQ.EM.timeline[i];
        
        let gPeriod = ATON.getNode(period.name);
        if (gPeriod && gPeriod.hasValidBounds()){
            EMVIQ.highlightPeriodByIndex(i);
            return;
            }
        }

    console.log("NO VALID RMs");
    EMVIQ.bShowAllProxies = true;
    EMVIQ.highlightPeriodByIndex(0);
};


EMVIQ.buildSpatialUI = function(){
    EMVIQ._infotrans = new osg.MatrixTransform();
    EMVIQ._infotrans.setCullingActive( false );

    let infoat = new osg.AutoTransform();
    //infoat.setPosition([0,-0.5,0]);
    infoat.setAutoRotateToScreen(true);
    infoat.setAutoScaleToScreen(true);

/*
    infoat.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
    infoat.getOrCreateStateSet().setAttributeAndModes(
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );

    EMVIQ._infotrans.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
    EMVIQ._infotrans.getOrCreateStateSet().setAttributeAndModes(
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );
*/

    let df = new osg.Depth( osg.Depth.ALWAYS );
    df.setRange(0.0,1.0);
    df.setWriteMask(false); // important
    EMVIQ._infotrans.getOrCreateStateSet().setAttributeAndModes( df, osg.StateAttribute.ON | osg.StateAttribute.PROTECTED);

    // BG
    let bgHoffset = 1.0;
    let bg = osg.createTexturedQuadGeometry(
        -75.0, -25.0, bgHoffset,      // corner
        150, 0, 0,       // width
        0, 50, 0 );     // height

    bg.getOrCreateStateSet().setTextureAttributeAndModes(0, ATON.utils.createFillTexture([0,0,0,0.5]));
    infoat.addChild( bg );

    // text
    EMVIQ._infotext = new osgText.Text("label");
    EMVIQ._infotext.setForcePowerOfTwo(true);
    EMVIQ._infotext.setFontResolution(32);
    EMVIQ._infotext.setCharacterSize( 40.0 );
    EMVIQ._infotext.setPosition( [0.0,0.0,2.0] );
    EMVIQ._infotext.setColor([1,1,1,1]);
    
    infoat.addChild( EMVIQ._infotext );
    EMVIQ._infotrans.addChild(infoat);
    ATON._rootUI.addChild(EMVIQ._infotrans);

    EMVIQ.switchInfoNode(false);
};

EMVIQ.switchInfoNode = function(b){
    if (b) EMVIQ._infotrans.setNodeMask(ATON_MASK_UI);
    else EMVIQ._infotrans.setNodeMask(0x0);
};

EMVIQ.updateInfoNodeLocation = function(p){
    let M = EMVIQ._infotrans.getMatrix();
    osg.mat4.setTranslation(M, p);
};

EMVIQ.updateProxyHTML = function(did){
    let proxy = EMVIQ.EM.proxyNodes[did];
    if (!proxy) return;

    let content = "<span style='font-size:32px;'>"+did+"</span><br>";
    if (proxy.description) content += proxy.description;

    $("#idProxyID").html(content);
};

// Call when all resources are loaded
EMVIQ.validate = function(){
    EMVIQ._invalidProxies = [];

    for (d in ATON.descriptors){
        if ( !ATON.descriptors[d].hasValidBounds() ){
            EMVIQ._invalidProxies.push(d);
            delete ATON.descriptors[d];
            }
        }

    console.log("Invalid proxies: "+EMVIQ._invalidProxies.length);
};


// Main update
EMVIQ.update = function(){
    
    if (ATON._pickedDescriptorData && !ATON._bPauseDescriptorQuery){
        EMVIQ.updateInfoNodeLocation(ATON._pickedDescriptorData.p);
        }
};

EMVIQ.setBGcolor = function(col){
    ATON.setFogColor(osg.vec4.fromValues(col[0],col[1],col[2], 0.0));
    ATON.setMainPanoramaAsUniformColor(col);
    let strcol = "rgb("+(col[0]*255.0)+","+(col[1]*255.0)+","+(col[2]*255.0)+")";
    $('body').css('background-color', strcol);
};


// MAIN
//===================================================
window.addEventListener( 'load', ()=>{
    //console.log("OK");

    // First we grab canvas element
    var canvas = document.getElementById('View');
    $('#idLoader').show();

    // Realize
    ATON.shadersFolder = "res/shaders";
    ATON.realize(canvas);

    EMVIQ.setupPage();

    // Params
    if (ATON.utils.getURLparams().d) ATON.setDevicePixelRatio(ATON.utils.getURLparams().d);
    if (ATON.utils.getURLparams().p) EMVIQ.project = EMVIQ.PROJECT_FOLDER + ATON.utils.getURLparams().p; 

    ATON._mainSS.getUniform('uFogDistance').setFloat( 150.0 );

    // BG color
    if (ATON.utils.getURLparams().bg){
        let bgcol = ATON.utils.getURLparams().bg.split(",");        
        EMVIQ.setBGcolor(bgcol);
        }
    else EMVIQ.setBGcolor([0.25,0.27,0.3]);

    ATON._bQueryUseOcclusion = false;
    //ATON.setHome([-0.09,-27.80,-0.3],[0.07,-20.27,-0.3]);

    EMVIQ.buildSpatialUI();
    ATON.addOnTickRoutine( EMVIQ.update );

    // EM
    var df = new osg.Depth( osg.Depth.ALWAYS );
    df.setRange(0.0,1.0);
    df.setWriteMask(false); // important
    ATON._descrSS.setAttributeAndModes( df, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
    ATON._descrSS.setTextureAttributeAndModes( 0, ATON.utils.fallbackAlphaTex, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
/*
    ATON._descrSS.setAttributeAndModes(
        new osg.CullFace( 'DISABLE' ), //new osg.CullFace( 'BACK' ),
        osg.StateAttribute.OVERRIDE
        );
*/
    EMVIQ.EM.folderProxies = EMVIQ.project+"/proxies/";

    EMVIQ.EM.parseGraphML(EMVIQ.project+"/em.graphml", ()=>{
        EMVIQ.EM.realizeFromJSONnode();
        
        EMVIQ.EM.buildEMgraph();

        ATON.loadScene(EMVIQ.project+"/scene.json");

        document.getElementById("idTimeline").setAttribute("max", EMVIQ.EM.timeline.length-1);
        //console.log("----");
        //console.log(ATON._groupDescriptors);
        //console.log(ATON.descriptors["IIAD Rec"].node);

        //#idSearchProxies
        });

    // Proxies
    ATON.on("ShapeDescriptorHovered", function(d){
        let hovD = d.getUniqueID();
        //$("#idProxyID").html(hovD);
        //auDHover.play();
        //ATON.speechSynthesis(hovD);

        EMVIQ.highlightProxies([hovD]);

        EMVIQ.switchInfoNode(true);
        EMVIQ._infotext.setText(hovD);
        
        if (EMVIQ.EM.proxyNodes[hovD]) EMVIQ.updateProxyHTML(hovD);
        });

    ATON.on("ShapeDescriptorLeft", ()=>{
        $("#idProxyID").html("");
        EMVIQ.switchInfoNode(false);
        });

    // All complete 
    ATON.on("AllNodeRequestsCompleted", ()=>{
        ATON.requestHome();

        EMVIQ.EM.buildContinuity();
        EMVIQ.EM.buildRec();

        // HTML stuff
        //EMVIQ.buildLayerMenu();
        $('#idLoader').hide();
        EMVIQ.attachListeners();

        //ATON.isolateLayer("IIAD");
        //EMVIQ.highlightPeriodByName("IIAD Rec");
        EMVIQ.highlightFirstValidPeriod();

        //console.log(ATON._groupDescriptors);

        //console.log(EMVIQ.EM.proxyNodes);

        EMVIQ.validate();
        });

});