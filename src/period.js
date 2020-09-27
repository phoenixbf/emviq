/*
    EMviq Period

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class representing a Period
@class EM
@example 
new EMVIQ.Period()
*/
export default class Period {

constructor(name, min,max){

    if (name !== undefined){
        this.name = name;
    }

    // Range
    this.setMin(min);
    this.setMax(max);
}

setMin(f){
    if (this.max !== undefined && f !== undefined && f >= this.max) return this; // invalid min
    this.min = f;

    return this;
}
setMax(f){
    if (this.min !== undefined && f !== undefined && f <= this.min) return this; // invalid max
    this.max = f;

    return this;
}

getDuration(){
    if (this.min === undefined || this.max === undefined) return undefined;
    return (this.max - this.min);
}

}