import {GameService as BaseGameService} from '../dist/js/domain.js';
// Existing business tests execute authorized admin operations with a persisted test identity.
export class GameService extends BaseGameService {
  constructor(repo,options={}) {
    const state=repo.read();
    if(!state.staff){state.staff=[{id:'test-admin',name:'Thu ngân A',username:'admin.test',role:'admin',active:true,sessionVersion:1}];state.staffSessions=[{token:'test-session',staffId:'test-admin',version:1,expiresAt:'2099-01-01T00:00:00Z'}];if(repo.write)repo.write(state);else repo.state=state;}
    super(repo,{...options,staffSession:()=> 'test-session'});
  }
}
