EMVIQ = {};

EMVIQ.MODELS_ROOT = "../../models/";

EMVIQ.currPeriodName = undefined;
EMVIQ.EM = new ATON.emviq.EM();

EMVIQ.setupPage = function(){

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

EMVIQ.buildLayerMenu = function(){
    if (ATON.layers.length == 0) return;

    for (var layername in ATON.layers){
        let checked = "checked";
        if (ATON.layers[layername].getNodeMask() === 0) checked = "";
        //console.log(layername+" : "+checked);

        ////$('#idLayers').append('<option value="' + key + '">' + key + '</option>');

        //$('#idLayers').append('<div class="atonBTN" onclick=\'ATON.isolateLayer("'+layername+'")\' >'+layername+'</div><br>');
        }

    //$('#idLayers').append('<button type="button" class="atonBTN" style="width:100%" onclick="ATON.requestPOVbyActiveLayers()">Focus</button>');
    //$('#idLayers').append('<input type="checkbox" name="idIsolateLayer">Isolate');
};

EMVIQ.highlightProxy = function(id){
    let proxiesGroup = ATON.getDescriptor(EMVIQ.currPeriodName);
    if (!proxiesGroup) return;

    let p = EMVIQ.EM.getPeriodFromName(EMVIQ.currPeriodName);

    //console.log(dg);
    let numProxies = proxiesGroup.children.length;

    for (let d = 0; d < numProxies; d++){
        const D = proxiesGroup.children[d];
        let did = D.getUniqueID();
        
        if (did === id){
            D.getSS().setTextureAttributeAndModes( 0, p.tex, osg.StateAttribute.ON | osg.StateAttribute.PROTECTED);
            //D.setStateSet(undefined);
            }
        else {
            D.setStateSet(undefined);
            //D.getSS().setTextureAttributeAndModes( 0, ATON.utils.fallbackAlphaTex, osg.StateAttribute.ON | osg.StateAttribute.PROTECTED);
            }
        }
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
	$(function() {
		$(document).keydown(function(e){
	    	if (e.key == 'c'){
				EMVIQ.logPOV();
                }

            });

        // UP
        $(document).keyup(function(e){
            //if (e.key == 'x'){}  
            });
        });
};

EMVIQ.buildSG = function(){

    // XXsec
    let periodName = "XX sec";

    for (let b = 1; b <= 10; b++)
        ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/XXsec/LOD2_TM"+b+".osgjs").attachTo(periodName);
/*
        ATON.addGraph(EMVIQ.MODELS_ROOT+"_prv/greattemple/XXsec/_lo-LOD2_TM"+b+".osgjs", { 
            layer: periodName,
            hiresurl: EMVIQ.MODELS_ROOT+"_prv/greattemple/XXsec/LOD2_TM"+b+".osgjs",
            hirespxsize: 600000,
            });
*/
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/XXsec/GreatTemple_surroundings.osgjs").attachTo(periodName);
    //ATON.addGraph(EMVIQ.MODELS_ROOT+"_prv/greattemple/XXsec/GreatTemple_surroundings.osgjs",{layer: periodName});

    // [43.795,-8.741,-3.043] [-5.142,2.907,-2.637]
    // 38,653 -5,834‬ -5,68‬
    //let T = ATON.utils.generateTransformFromString("-57.8719596862793 -303.2223815917969 4.660361289978027 0 0 -0.163");
/*
    let T = ATON.utils.generateTransformFromString("0 0 0 0 0 -0.163");
    ATON.transformLayerByMatrix(periodName, T.getMatrix());
    ATON.translateLayer(periodName, [-106.5, -290, 5.0]);
*/
    ATON.getNode(periodName).transformByString("-106.5 -290 5.0 0 0 -0.163");

    // IIAD Rec
    periodName = "IIAD Rec";
    let N = ATON.getNode(periodName);

    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Walls_BAKE_m.osgjs").attachTo(N);

    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Travi_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Tetto1_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Tetto_6_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Tetto_5_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Tetto_4_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Tetto_3_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Tetto_2_BAKE_m.osgjs").attachTo(N);

    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Terreno_interno_BAKE_m.osgjs").attachTo(N);

    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Tempio_6_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Tempio_5_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Tempio_4_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Tempio_3_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Tempio_2_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/tempio_1_BAKE_m.osgjs").attachTo(N);

    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Podio_2_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Podio1_BAKE_m.osgjs").attachTo(N);

    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Sottotetto_BAKE_m.osgjs").attachTo(N);

    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Scale_2_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Scale_1_BAKE_m.osgjs").attachTo(N);

    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Porta2_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Porta1_BAKE_m.osgjs").attachTo(N);

    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Pavimento_1_BAKE_m.osgjs").attachTo(N);

    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Ingresso_3_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Ingresso_2_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Ingresso_1_BAKE_m.osgjs").attachTo(N);

    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Cassettonato_BAKE_m.osgjs").attachTo(N);
    ATON.createAssetNode(EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Architrave_1_BAKE_m.osgjs").attachTo(N);

    
    ATON.createProductionFromASCII(
        EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Column_light_m.osgjs",
        EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Column_light-inst.txt"
        ).attachTo(N);

    ATON.createProductionFromASCII(
        EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Column_shadow_m.osgjs",
        EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Column_shadow-inst.txt"
        ).attachTo(N);

    ATON.createProductionFromASCII(
        EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Column_entrance_m.osgjs",
        EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Column_entrance-inst.txt" 
        ).attachTo(N);

    ATON.createProductionFromASCII(
        EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Column_tempio_m.osgjs",
        EMVIQ.MODELS_ROOT+"_prv/greattemple/IIAD/Column_tempio-inst.txt" 
        ).attachTo(N);

};

EMVIQ.highlighPeriodByName = function(periodname){
    $('#idPeriodName').html(periodname);
    EMVIQ.currPeriodName = periodname;
    /*if (ATON.layers[periodname])*/ 
        //ATON.isolateLayer(periodname);

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
EMVIQ.highlighPeriodByIndex = function(i){
    let period = EMVIQ.EM.timeline[i];
    if (!period) return;

    EMVIQ.highlighPeriodByName(period.name);
};

EMVIQ.search = function(str){

};




// MAIN
//===================================================
window.addEventListener( 'load', function () {
    //console.log("OK");

    // First we grab canvas element
    var canvas = document.getElementById('View');
    $('#idLoader').show();

    // Realize
    ATON.shadersFolder = "../../res/shaders";
    ATON.realize(canvas);

    EMVIQ.setupPage();

    if (ATON.utils.getURLparams().d) ATON.setDevicePixelRatio(ATON.utils.getURLparams().d);

    ATON._mainSS.getUniform('uFogDistance').setFloat( 150.0 );
    $('body').css('background-color', 'rgb(65,70,79)');
    ATON.setFogColor(osg.vec4.fromValues(0.25,0.27,0.3, 0.0));

    ATON._bQueryUseOcclusion = false;
    ATON.setHome([-0.09,-27.80,-0.3],[0.07,-20.27,-0.3]);

    // EM
    var df = new osg.Depth( osg.Depth.ALWAYS );
    df.setRange(0.0,1.0);
    df.setWriteMask(false); // important
    ATON._descrSS.setAttributeAndModes( df, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
    ATON._descrSS.setTextureAttributeAndModes( 0, ATON.utils.fallbackAlphaTex, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    EMVIQ.EM.folderProxies = EMVIQ.MODELS_ROOT+"_prv/greattemple/proxies/";

    EMVIQ.EM.parseGraphML(EMVIQ.MODELS_ROOT+"_prv/greattemple/gt-em.graphml", ()=>{
        EMVIQ.EM.realizeFromJSONnode();
        
        //EMVIQ.EM.buildEMgraph();
        EMVIQ.buildSG();

        document.getElementById("idTimeline").setAttribute("max", EMVIQ.EM.timeline.length);
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

        EMVIQ.highlightProxy(hovD);
        
        if (EMVIQ.EM.proxyNodes[hovD]){
            let proxy = EMVIQ.EM.proxyNodes[hovD];
            let content = "<b>"+hovD+"</b>";
            if (proxy.description) content += ": "+proxy.description;

            $("#idProxyID").html(content);
            }
        });
    ATON.on("ShapeDescriptorLeft", ()=>{
        $("#idProxyID").html("");
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
        EMVIQ.highlighPeriodByName("IIAD Rec");

        //console.log(ATON._groupDescriptors);

        //console.log(EMVIQ.EM.proxyNodes);
        });

});