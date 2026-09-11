// Deliberately distinct arcade handling, not manufacturer performance claims.
// Speeds are metres/second; acceleration and braking are metres/second squared.
const common={reverseAccel:2.4,brake:10,rollingDrag:.08,aeroDrag:.003,steering:.56,steeringResponse:7,grip:7.5,yawResponse:5,rollGain:.018,maxLean:.14,wheelRadius:.31,boostChargePerMetre:.24,boostDrainPerSecond:20};
const ground={
 auto:{accel:4.2,boostAccel:7,maxSpeed:18,boostSpeed:26,reverseSpeed:4,wheelbase:1.96,brake:8,grip:6,steering:.62,rollGain:.018,maxLean:.14},
 cybertruck:{accel:6.8,boostAccel:10.5,maxSpeed:36,boostSpeed:48,reverseSpeed:5,wheelbase:3.635,wheelRadius:.43925,brake:10,grip:7,steeringResponse:5,yawResponse:3.8,rollGain:.006,maxLean:.045,boostChargePerMetre:.2},
 cybercab:{accel:5.3,boostAccel:8.5,maxSpeed:29,boostSpeed:39,reverseSpeed:4.5,wheelbase:2.7,wheelRadius:.35,brake:10.5,grip:8,steeringResponse:6,rollGain:.007,maxLean:.055,boostChargePerMetre:.26},
 kitt:{accel:8.2,boostAccel:13,maxSpeed:44,boostSpeed:60,reverseSpeed:5,wheelbase:2.5654,wheelRadius:.324,brake:13,grip:10,rollingDrag:.05,aeroDrag:.002,steering:.5,steeringResponse:9,yawResponse:7,rollGain:.005,maxLean:.04,boostChargePerMetre:.18},
 cycle:{accel:1.7,boostAccel:3,maxSpeed:8.5,boostSpeed:12.5,reverseSpeed:1,reverseAccel:1,wheelbase:1.1,wheelRadius:.34,brake:5,grip:5.5,steering:.7,rollGain:-.075,maxLean:.32,boostChargePerMetre:.7,boostDrainPerSecond:16},
 yulu:{accel:2,boostAccel:3,maxSpeed:7,boostSpeed:10,reverseSpeed:1.5,wheelbase:1.14,wheelRadius:.255,brake:5.5,grip:5.8,rollGain:-.075,maxLean:.34,boostChargePerMetre:.6},
 bike:{accel:5,boostAccel:8,maxSpeed:25,boostSpeed:34,reverseSpeed:1.5,wheelbase:1.32,wheelRadius:.3,brake:9,grip:8,rollGain:-.075,maxLean:.4,boostChargePerMetre:.3},
 delivery:{accel:4,boostAccel:6,maxSpeed:22,boostSpeed:29,reverseSpeed:1.5,wheelbase:1.32,wheelRadius:.3,brake:8,grip:7,rollGain:-.065,maxLean:.32,boostChargePerMetre:.35}
};
export const HELICOPTER_PROFILE=Object.freeze({maxSpeed:58,boostSpeed:85,boostMultiplier:2.2,verticalSpeed:26,boostChargePerMetre:.12,boostDrainPerSecond:18});
export function vehicleProfile(id){if(id==='helicopter')return {...HELICOPTER_PROFILE};return {...common,...(ground[id==='supercar'?'kitt':id]||ground.auto)};}
