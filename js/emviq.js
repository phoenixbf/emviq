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

EMVIQ._infotrans = undefined;
EMVIQ._infotext  = undefined;


EMVIQ.setupPage = function(){
    let elSearch = document.getElementById( "idSearch" );
    elSearch.addEventListener( 'keydown', (e)=>{ e.stopPropagation(); }, false );

    $('#idSearch').on('keyup', ()=>{
        let string = $('#idSearch').val();
        EMVIQ.search(string);
        });

    $('#idSearch').focus(()=>{ ATON._bPauseDescriptorQuery = true; EMVIQ.switchInfoNode(false); });
    $('#idSearch').blur(()=>{ ATON._bPauseDescriptorQuery = false; });
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

        D.setStateSet(undefined);
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
        let texcol = ATON.emviq.nodeTexColors[proxy.type];
        //if (!texcol) texcol = period.tex;
        //console.log(proxy.type);

        D.setStateSet(undefined);

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
        return;
        }

    string = string.toLowerCase();

    //console.log("Searching "+string);

    let hProxies  = [];
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
                }
            }


        if (bAdd){
            hProxies.push(did);
            bsProxies.expandByBoundingSphere( D.getBoundingSphere() );
            //console.log("MATCH "+did);
            }
        
        }

    let len = hProxies.length;
    if (len > 0){
        //console.log(hProxies);
        $("#idProxyID").html("");

        EMVIQ.highlightProxies(hProxies);
        ATON.requestPOVbyBound(bsProxies, 2.0, 1.0);

        $("#idSearchMatches").html("<b>"+len+"</b> matches");

        //if (ATON.descriptors[i].onSelect) ATON.descriptors[i].onSelect();  
        //else ATON.requestPOVbyDescriptor(i, 0.5);
        }
    else EMVIQ.blurProxiesCurrPeriod();
};

EMVIQ.searchClear = function(){
    $('#idSearch').val('');
    $("#idSearchMatches").html("");
    ATON._bPauseDescriptorQuery = false;
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

    ATON.on("KeyPress",(k)=>{
        if (k === 'f'){
            ATON._bPauseDescriptorQuery = !ATON._bPauseDescriptorQuery;
            }
        });
};

EMVIQ.highlightPeriodByName = function(periodname){
    $('#idPeriodName').html(periodname);
    
    EMVIQ.currPeriodName = periodname;

    EMVIQ.EM.timeline.forEach(p => {
        if (p.name === periodname){
            ATON.getNode(p.name).switch(true);
            ATON.getDescriptor(p.name).switch(true);
            }
        else {
            ATON.getNode(p.name).switch(false);
            ATON.getDescriptor(p.name).switch(false);
            }
        //console.log(p.name);
        });

    //console.log(ATON.getRootDescriptors());
};

// By index
EMVIQ.highlightPeriodByIndex = function(i){
    let period = EMVIQ.EM.timeline[i];
    if (!period) return;

    //$("#idTimeline").val(i);

    //EMVIQ.currPeriodIndex = i;
    EMVIQ.highlightPeriodByName(period.name);
};


EMVIQ.buildSpatialUI = function(){
    EMVIQ._infotrans = new osg.MatrixTransform();
    EMVIQ._infotrans.setCullingActive( false );

    let infoat = new osg.AutoTransform();
    //infoat.setPosition([0,-0.5,0]);
    infoat.setAutoRotateToScreen(true);
    infoat.setAutoScaleToScreen(true);

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

// Main update
EMVIQ.update = function(){
    
    if (ATON._pickedDescriptorData){
        EMVIQ.updateInfoNodeLocation(ATON._pickedDescriptorData.p);
        }
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
    $('body').css('background-color', 'rgb(65,70,79)');
    ATON.setFogColor(osg.vec4.fromValues(0.25,0.27,0.3, 0.0));

    ATON._bQueryUseOcclusion = false;
    ATON.setHome([-0.09,-27.80,-0.3],[0.07,-20.27,-0.3]);

    EMVIQ.buildSpatialUI();
    ATON.addOnTickRoutine( EMVIQ.update );

    // EM
    var df = new osg.Depth( osg.Depth.ALWAYS );
    df.setRange(0.0,1.0);
    df.setWriteMask(false); // important
    ATON._descrSS.setAttributeAndModes( df, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
    ATON._descrSS.setTextureAttributeAndModes( 0, ATON.utils.fallbackAlphaTex, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    EMVIQ.EM.folderProxies = EMVIQ.project+"/proxies/";

    EMVIQ.EM.parseGraphML(EMVIQ.project+"/em.graphml", ()=>{
        EMVIQ.EM.realizeFromJSONnode();
        
        //EMVIQ.EM.buildEMgraph();
        //EMVIQ.buildSG();
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
        
        if (EMVIQ.EM.proxyNodes[hovD]){
            let proxy = EMVIQ.EM.proxyNodes[hovD];
            let content = "<strong>"+hovD+"</strong><br>";
            if (proxy.description) content += proxy.description;

            $("#idProxyID").html(content);
            }
        });
    ATON.on("ShapeDescriptorLeft", ()=>{
        $("#idProxyID").html("");
        EMVIQ.switchInfoNode(false);
        });

    // All complete 
    ATON.on("AllNodeRequestsCompleted", ()=>{
        ATON.requestHome();

        // HTML stuff
        //EMVIQ.buildLayerMenu();
        $('#idLoader').hide();
        EMVIQ.attachListeners();

        // Tweak
        //for (d in ATON.descriptors){ if (ATON.descriptors[d].node) ATON.descriptors[d].node.setNodeMask(0x0);  }

        //ATON.isolateLayer("IIAD");
        EMVIQ.highlightPeriodByName("IIAD Rec");

        //console.log(ATON._groupDescriptors);

        //console.log(EMVIQ.EM.proxyNodes);
        });

});