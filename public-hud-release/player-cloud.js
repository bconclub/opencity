// Root UI owns the explicit Connect cloud button. Restoring never creates users.
export function connectPlayerCloud(stats,config){
 if(!stats||!config?.url||!config?.publishableKey&&!config?.anonKey)throw Error('Player cloud configuration is incomplete.');
 const adapter={list:()=>stats.listMeetups(),create:data=>stats.createMeetup(data)};
 function wireMeetups(){window.configureOpenCityMeetups?.(adapter);}
 wireMeetups();
 return{
  async connect(){const result=await stats.connectCloud(window.multiplayerState?.().name||localStorage.getItem('opencity-player-name')||'Explorer');wireMeetups();return result;},
  async restore(){const restored=await stats.restoreCloud();wireMeetups();return restored;},
  meetups:adapter
 };
}
