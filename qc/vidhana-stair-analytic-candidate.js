import{buildLandmarks as build}from'./vidhana-architecture-integration-stair-treatment-isolated.js';
import{applyStairAnalyticMaterial}from'./vidhana-stair-analytic-material.js';
export function buildLandmarks(T,data,xy){const result=build(T,data,xy),stair=result.group.children.find(x=>x.material.userData.stairSurface);if(!stair)throw new Error('Expected staircase');applyStairAnalyticMaterial(T,stair,result.architecture.stairPlacement,result.architecture);return result;}
