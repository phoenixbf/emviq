/*
    ATON Scene Hub
    scene JSON routines

    author: bruno.fanini_AT_gmail.com

===========================================================*/
import Period from "./period.js";

/**
EMUtils
@namespace EMUtils
*/
let EMUtils = {};

EMUtils.comparePeriod = ( a, b )=>{
    if ( a.min < b.min ) return -1;
    if ( a.min > b.min ) return 1;
    return 0;
};

EMUtils.getOrCreateEMData = (semnode)=>{
    if (semnode === undefined) return;

    if (semnode.userData.EM === undefined){
        semnode.userData.EM = {};
        semnode.userData.EM.type = undefined;
        semnode.userData.EM.time = undefined;

        semnode.userData.EM.isProxy = false;
        
        semnode.userData.EM.period  = undefined; // reference period in EM
        semnode.userData.EM.periods = {}; // All span (continuity, etc..)
    }

    return semnode.userData.EM;
};


EMUtils.assignProxyNodeToPeriod = (proxNode, period)=>{
    if (proxNode === undefined) return;
    if (period === undefined) return;

    if (proxNode.userData.periods === undefined) proxNode.userData.periods = {};
    proxNode.userData.periods[period] = true;
};

export default EMUtils;