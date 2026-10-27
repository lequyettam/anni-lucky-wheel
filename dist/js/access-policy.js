/** Shared demo policy. Production must evaluate the same rules on the server. */
export const ACCESS_MODULES = [
  {id:'overview',label:'Tổng quan',route:'admin',icon:'grid',edit:false},
  {id:'vouchers',label:'Voucher',route:'admin/vouchers',icon:'ticket',edit:'Xác nhận sử dụng'},
  {id:'prizes',label:'Phần thưởng',route:'admin/prizes',icon:'gift',edit:'Chỉnh sửa'},
  {id:'codes',label:'Mã cấp lượt',route:'admin/codes',icon:'ticket',edit:'Chỉnh sửa'},
  {id:'reports',label:'Danh sách trúng',route:'admin/reports',icon:'chart',edit:'Xuất CSV'},
  {id:'themes',label:'Giao diện & chủ đề',route:'admin/themes',icon:'spark',edit:'Chỉnh sửa'},
  {id:'content',label:'Nội dung & thương hiệu',route:'admin/content',icon:'edit',edit:'Chỉnh sửa'},
  {id:'settings',label:'Thiết lập',route:'admin/settings',icon:'settings',edit:'Chỉnh sửa'}
];
export const STAFF_ROLES = {viewer:'Chỉ xem voucher',cashier:'Thu ngân',admin:'Quản trị viên'};
export const routePermission = route => route==='admin/staff'?'staff.manage':route==='admin/redeem'?'vouchers.view':ACCESS_MODULES.find(m=>m.route===route)?.id+'.view';
export const editPermission = module => module==='vouchers'?'vouchers.redeem':module==='reports'?'reports.export':module+'.edit';
export const ALL_PERMISSIONS = [...ACCESS_MODULES.flatMap(m=>[m.id+'.view',...(m.edit?[editPermission(m.id)]:[])]),'staff.manage','data.reset'];
export function presetPermissions(role) {
  if(role==='admin')return [...ALL_PERMISSIONS];
  if(role==='cashier')return ['vouchers.view','vouchers.redeem'];
  if(role==='viewer')return ['vouchers.view'];
  return [];
}
export function staffPermissions(staff) {
  if(!staff?.active||!Object.hasOwn(STAFF_ROLES,staff.role))return [];
  if(staff.role==='admin')return presetPermissions('admin');
  return (Array.isArray(staff.permissions)?staff.permissions:presetPermissions(staff.role)).filter(p=>ALL_PERMISSIONS.includes(p)&&!['staff.manage','data.reset'].includes(p));
}
export const can = (staff, permission) => ALL_PERMISSIONS.includes(permission)&&staffPermissions(staff).includes(permission);
export function sessionActor(state,sessionToken,now=new Date()) {
  if(!sessionToken)return null;
  const session=state.staffSessions?.find(s=>s.token===sessionToken&&+new Date(s.expiresAt)>+now);
  const staff=session&&state.staff?.find(s=>s.id===session.staffId&&s.active&&s.sessionVersion===session.version);
  return staff&&Object.hasOwn(STAFF_ROLES,staff.role)?staff:null;
}
export function requirePermission(state,sessionToken,permission,now=new Date()) {
  const actor=sessionActor(state,sessionToken,now);
  if(!actor)throw new Error('Phiên nhân viên đã kết thúc. Vui lòng đăng nhập lại.');
  if(!can(actor,permission))throw new Error('Tài khoản không có quyền thực hiện thao tác này.');
  return actor;
}
export const staffHome = staff => can(staff,'vouchers.view')?'admin/vouchers':ACCESS_MODULES.find(m=>can(staff,m.id+'.view'))?.route||'admin';

// Explicit allowlist at the UI boundary; mutations are also checked inside transactions.
export const ACTION_PERMISSIONS = Object.fromEntries([
  ...['source','sound','spin','account','login','code','close','go-play','go-wallet','wallet-filter','voucher','copy','copy-recovery','recovery','recovery-saved','logout','logout-confirm','help','use-voucher','customer-redeem'].map(a=>[a,null]),
  ...['staff-account','staff-logout'].map(a=>[a,'session']),
  ...['staff-add','staff-edit','staff-tab'].map(a=>[a,'staff.manage']),
  ['staff-lookup','vouchers.view'],['staff-voucher','vouchers.view'],['confirm-redeem','vouchers.redeem'],['redeem','vouchers.redeem'],
  ['content-section','content.view'],
  ...['content-reset-field','content-remove-logo','content-reset-section','content-reset-all','content-previous','content-discard','content-restore-confirm'].map(a=>[a,'content.edit']),
  ...['theme-select','theme-discard'].map(a=>[a,'themes.view']),
  ...['add-prize','edit-prize','remove-image','delete-prize','discard-prizes','save-prizes'].map(a=>[a,'prizes.edit']),
  ...['add-code','edit-code','generate-code'].map(a=>[a,'codes.edit']),
  ['export-report','reports.export'],['export-config','staff.manage']
]);
export const FORM_PERMISSIONS = {
  login:null,activate:null,name:null,claim:null,'staff-setup':null,'staff-login':null,
  'staff-save':'staff.manage','staff-password':'session',prize:'prizes.edit','code-admin':'codes.edit',
  appearance:'themes.edit',content:'content.edit',settings:'settings.edit',lookup:'vouchers.view'
};
