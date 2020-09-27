/*
    EM Node

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class
@class EM
@example 
new EMNode()
*/
export default class EMNode {

constructor(){
    this.children = [];
    //this.parents  = [];

    this.type = undefined;
    this.time = undefined;
    this.period = undefined;

    this.description = undefined;
    this.label = undefined;
    this.url = undefined;
}

addChild(N){
    this.children.push(N);
    //N.parents.push(this);
}

getChild(i){
    return this.children[i];
}

isLeaf(){
    if (this.children.length > 0) return false;
    return true;
}


};