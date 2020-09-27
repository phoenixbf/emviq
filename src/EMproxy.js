/*
    EMviq Proxy node

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class 
@class EM
@example 
new EMVIQ.Proxy()
*/
export default class Proxy {

constructor(){
    this.type   = undefined;
    this.t      = 0.0;
    this.periods = {};
    
    this.description = "";
    this.url = "";
}

assignToPeriod(periodname){
    this.periods[periodname] = true;
}

belongToPeriod(periodname){
    
}

}