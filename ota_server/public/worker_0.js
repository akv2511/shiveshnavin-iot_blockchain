load('api_sys.js'); 
load('api_wifi.js'); 
load('api_config.js'); 
load('api_http.js'); 
load('api_events.js'); 
load('api_rpc.js'); 
load('api_file.js'); 
load('api_gpio.js');  

let DEVICE_NAME=Cfg.get("device.idd");  
let DEVICE_NO=DEVICE_NAME.slice(7, 8); 
if(DEVICE_NAME==="iotain_0")
{
  DEVICE_NO="0";
  DEVICE_NAME="iotain_"+DEVICE_NO;
  Cfg.set({device:{idd:DEVICE_NAME}});
}   
let led =5; 
let led2=4;
let isEsp=DEVICE_NAME==="iotain_0" || DEVICE_NAME==="iotain_2" || DEVICE_NAME==="iotain_4";
if(isEsp)
{
  led=2; 
}
else{
  led=5; 
} 
GPIO.set_mode(led2,GPIO.MODE_OUTPUT);
let read_data=function(file){
	let clon=File.read(file);
	if(clon===null || clon===undefined){
		return {status:"COMMITED_OK"};
	}
	if(clon.length<5)
	{ 
		return null; 
	}
	return JSON.parse(clon);
};
let s = read_data('updater_data.json');
let  AP={
  ssid:DEVICE_NAME,pass:"password",enable:true,ip:"192.168."+DEVICE_NO+".1"
  ,gw:"192.168."+DEVICE_NO+".1",dhcp_start:"192.168."+DEVICE_NO+".2",dhcp_end:"192.168."+DEVICE_NO+".100"};
 
print(DEVICE_NAME,'===',DEVICE_NAME,"===");
print(DEVICE_NAME,' AP '+JSON.stringify(AP));
print(DEVICE_NAME,"WIFI ",Cfg.get("wifi.sta.ssid")," : ",Cfg.get("wifi.sta.pass"));
print(DEVICE_NAME,'===',Cfg.get("device.idd"),"===");

let wifi_setup=ffi('void change_wifi()');
let iotains=["iotain_0","iotain_1","iotain_2","iotain_3","iotain_4"];
if(s.status==="TO_COMMIT")
{
  print(DEVICE_NAME,"Updating Device Config");
  Cfg.set({wifi:{ap:AP}});
  Cfg.set({device:{idd:DEVICE_NAME}}); 
  if(iotains[0]===DEVICE_NAME)
  {
    Cfg.set({wifi:{sta:{ssid:"Swati_Niwas",pass:"mother1919",enable:true}}});
  }
  else{

    Cfg.set({wifi:{sta:{ssid:"Swati_Niwas",pass:"mother1919",enable:true}}});

    //Cfg.set({wifi:{sta:{ssid:iotains[0],pass:"password",enable:true},sta_connect_timeout:(10) }}); 
     
  } 
}  
read_data=undefined; 
AP=undefined;
gc(true); 

let init_led=ffi('void init_led(int,int)'); 
init_led(led,100);

let blink_once=ffi('void blink_once(int,int)'); 
let start_blink=ffi('void start_blink()'); 
let stop_blink=ffi('void stop_blink()');   
let on_delay=ffi('void on_delay(int,int)');   
let start_blink=ffi('void start_blink()'); 
let stop_blink=ffi('void stop_blink()');
let bt_setup=ffi('int bt_setup(bool)');


let status={ap:AP,sta_ip:"0.0.0.0",sta_ssid:Cfg.get("wifi.sta.ssid"),clients:[]}; 
let get_status=function()
{
    status.clients=clients;
    status.myHostIp=myHostIp;
    status.resources=resources;
    status.requests=requests; 
    status.name=DEVICE_NAME;
    return {status:status}; 
}; 
let reg_timer=-1;
let register=function(host,sta_ip)
{ 
  http_call(host+"/rpc/register",{ssid: DEVICE_NAME, ip: sta_ip}); 
};
let get_info=function()
{
  Cfg.set({bt:{enable:true}});
  RPC.call(RPC.LOCAL, 'Sys.GetInfo', null, function (resp, ud) { 
    status.sta_ip = resp.wifi.sta_ip; 
    status.sta_ssid="iotain_"+status.sta_ip.slice(8, 9) ; 
    myHostIp="192.168."+status.sta_ip.slice(8, 9)+".1"; 
    register( "192.168."+status.sta_ip.slice(8, 9)+".1", status.sta_ip ); 
  }, null); 
};
gc(true);
let clients=[]; 
let myHostIp="192.168."+DEVICE_NO+".1";
let timer_count=0;
let http_call=function(url,body)
{
   print(DEVICE_NAME,"HTTP CALL ",url,JSON.stringify(body));

   HTTP.query({
    url: url,
    headers: { 'Content-Type': 'application/json' },   
    data:body,
		success: function(body, full_http_msg) {
      print(DEVICE_NAME,body);       
		}   
	}); 
    
};
let res_base=JSON.parse(DEVICE_NO)*30;
let resources=[{"res_name":"diring room led","res_id":res_base+1},{"res_name":"diring room led","res_id":res_base+2},{"res_name":"diring room led","res_id":res_base+3}];
let find_resource=function(res_id)
{
 
    for(let i=0;i<resources.length;i++)
    {
        if(resources[i].res_id===res_id)
        { 
            return resources[i];
        }
    } 
    return undefined; 
};
GPIO.set_mode(5,GPIO.MODE_OUTPUT);
let perform_job=function(job)
{

  let res={message:"Job completed on "+DEVICE_NAME,val:10};
    if(job.res_id===1001)
    { 
        let status="on";
        if(job.action==="turn_on")
        {
          status="on";
          GPIO.write(5,1);
        }
        else{
          status="off";
          GPIO.write(5,0);
        }
        res={message:"LED Status Changed ! Job completed on "+DEVICE_NAME,led:status};
    }

    on_delay(led2,4000);
    print(DEVICE_NAME,"Performing ",job.res_name);
    return res;
    
};
let requests=[];
let find_request=function(req_id)
{ 
    for(let i=0;i<requests.length;i++)
    {
        if(requests[i].req_id===req_id)
        {
            return requests[i];
        }
    }
    return undefined;
};
let update_request=function(req)
{
     for(let i=0;i<requests.length;i++)
    {
        if(requests[i].req_id===req.req_id)
        {
            requests[i].status=req.status;
            return requests[i];
        }
    } 
};

let fwd_request=function(req)
{
    let _req={
        req_id:req.req_id,
        force_fwd:req.force_fwd,
        src_ip:"192.168."+DEVICE_NO+".1",
        status:req.status,
        job:req.job
    }; 
    print(DEVICE_NAME,"FWD RQ FROM:",req.src_ip," JOB:",req.job.res_name," TO:", JSON.stringify(clients)," And ",myHostIp); 
    for(let i=0;i<clients.length;i++)
    { 
        http_call("http://"+clients[i].ip+"/rpc/on_request",_req);
    }
    _req.src_ip=status.sta_ip;
    http_call("http://"+myHostIp+"/rpc/on_request",_req);

    return {"forwarded_to":clients}; 
};  

/*********DEVICE SPECIFIC */


/***---TouchPad---- */
load('api_esp32_touchpad.js'); 
let ts = TouchPad.GPIO[14];
let lastTouch=0;
let led_on=false;
let on_touch=function(st)
{
 
  let val = TouchPad.readFiltered(ts);
  print('Status:', st, 'Value:', val);   
  let req={
    req_id:JSON.stringify(Timer.now()),
    src_ip:"0.0.0.0",
    status:{"message":"under process"},
    job:{"res_id":1001,"res_name":"LED Strip","action":led_on?"turn_off":"turn_on"}
  };
  led_on=!led_on;
  RPC.call(RPC.LOCAL, 'on_request', req, function (resp, ud) {
    print('Response:', JSON.stringify(resp));
  }, null);

}; 
if(DEVICE_NAME==="iotain_3")
{
  resources.push({"res_name":"LED Strip","res_id":1001});
}

TouchPad.init();
TouchPad.filterStart(10);
TouchPad.setMeasTime(0x1000, 0xffff);
TouchPad.setVoltage(TouchPad.HVOLT_2V4, TouchPad.LVOLT_0V8, TouchPad.HVOLT_ATTEN_1V5);
TouchPad.config(ts, 0);
Sys.usleep(100000); // wait a bit for initial filtering.
let noTouchVal = TouchPad.readFiltered(ts);
let touchThresh = noTouchVal * 2 / 3;
print('Sensor', ts, 'noTouchVal', noTouchVal, 'touchThresh', touchThresh);
TouchPad.setThresh(ts, touchThresh);
TouchPad.isrRegister(function(st) {
  
  
  if(Timer.now()-lastTouch<1.2 )
  {
    return;
  }
  lastTouch=Timer.now();
  on_touch(st);

}, null);
if(DEVICE_NAME!=="iotain_3")
  TouchPad.intrEnable();
 
 
/***---HID---- */

load('api_bt_gap.js');
let lastBtScan=[];
let currentScan=[];
let scanBtTimer=-1;
let BT_SCAN_INTERVAL=2000;
let lastBtHumanState="";
let HID_STATE_IN="HUMAN_IN";
let HID_STATE_OUT="HUMAN_OUT";

let on_human=function(isIn)
{
  //print(DEVICE_NAME,"Contains Human ",isIn);
  if(isIn)
  {

  }
  else
  {

  }
};
  let bt_detector=function(action)
  {


      if(action===1)
      {
        if(scanBtTimer!==-1)
        {
          Timer.del(scanBtTimer);
          scanBtTimer=-1;
        }
        scanBtTimer=Timer.set((BT_SCAN_INTERVAL*2),Timer.REPEAT,function()
        {

          GAP.scan(BT_SCAN_INTERVAL,false);

        },null);


      }
    else if(action===0)
      {
        lastBtHumanState="";
        if(scanBtTimer===-1)
        {
          
        }
      else
        {
          Timer.del(scanBtTimer);
        }
        scanBtTimer=-1;
      }
      else{

        
      }

     let res= {last_scan:lastBtScan,no:lastBtScan.length,scan:scanBtTimer===-1?"Stopped":"Running"};
     print(DEVICE_NAME,"BT Human Identifier -> ",JSON.stringify(res)); 
     return res;

  };


  if(DEVICE_NAME==="iotain_0")
  {
    Cfg.set({bt:{enable:true,keep_enabled:true,adv_enable:true}});
  
    RPC.addHandler('scan',function(args)
    {
        return bt_detector(args.action);
    });
    
    bt_detector(1);
  }

/********************* */
RPC.addHandler('changeDeviceName',function(args){

  if(args.new_name!==undefined)
  {
    let OLD_DEVICE_NAME=DEVICE_NAME;
    DEVICE_NAME=args.new_name;
    Cfg.set({device:{idd:DEVICE_NAME}});
    
    print(DEVICE_NAME,"Device Rebooting !!");
    Sys.reboot(500)
    return {old_name:OLD_DEVICE_NAME,new_name:Cfg.get("device.idd")};
  }
  else{
    
    return {message:"Empty New Name "};
  }

});
RPC.addHandler('status',function(args){
  
  return get_status();

}); 
RPC.addHandler('register',function(args)
{ 
  for(let i=0;i<clients.length;i++)
  {
    if(clients[i].ssid===args.ssid)
    {
      clients[i].ip=args.ip;
      return {status:"Already Registered"};
    }
  }
  clients.push({ssid:args.ssid,ip:args.ip});
  return {status:"Registered"};

});  
RPC.addHandler('on_callback',function(req){

  on_delay(led2,4000);
  Sys.usleep(1000);
  print(DEVICE_NAME,"callback on "+DEVICE_NAME, " ID ",req.req_id); 
  gc(true);
  let req_hist=find_request(req.req_id);
  if(req_hist===undefined)
  {
      return {result:"FATAL:ERR: request not found on this node"};
  }
  
  let rq=update_request(req); 
  print(DEVICE_NAME,"FWD RES TO:",rq.src_ip," JOB:",rq.job.res_name);
  rq.status=req.status;
  http_call("http://"+rq.src_ip+"/rpc/on_callback",rq); 

  return {result:{"reverted_to":(rq.src_ip)},status:"Response reverted"};
});   
GPIO.write(led2,0);
RPC.addHandler('on_request',function(req){
 
  print(DEVICE_NAME,"request on "+DEVICE_NAME, " ID ",req.req_id);gc(true); 
  let res=find_resource(req.job.res_id);
  if(res===undefined)
  {
      let req_hist=find_request(req.req_id);
      if(req_hist!==undefined)
      {
          if(req.force_fwd!==undefined)
          {
              fwd_request(req);
              return {result:clients,status:"forwarding request"};
          }
          print("Already Recieved ",req.req_id );
          return {result:req_hist.status,status:"request already recieved"}; 
      }
      else{
           
          blink_once(led2,50);
          requests.push(req);  
          return {result:fwd_request(req),status:"forwarding request"};

      }
  }
  else{
      let respo=perform_job(req.job);
      req.status=respo;
      requests.push(req);
      http_call("http://"+req.src_ip+"/rpc/on_callback",req);
      
      return  {result:respo,status:"performing job"};
  } 
}); 
 
let index=1+JSON.parse(DEVICE_NO);
start_blink();
let diconnect_count=0;
Event.addGroupHandler(GAP.EV_GRP,function(ev,evdata,arg)
{

  if(ev===GAP.EV_SCAN_RESULT)
  {
    
    let rs= (GAP.getScanResultArg(evdata)); 
    currentScan.push({addr:rs.addr});

  }
  else if(ev===GAP.EV_SCAN_STOP){

    lastBtScan=[];
    let devices="";
    for(let i=0;i<currentScan.length;i++)
    {
      lastBtScan.push(currentScan[i]);
      devices=devices+"||"+JSON.stringify(currentScan[i].addr);
    }
    currentScan=[];

 
      if(devices.indexOf("c1:31:8f:7c:11:75")>-1)
      {
        if(lastBtHumanState!==HID_STATE_IN)
          {
            print(DEVICE_NAME,"You are IN");
          }
        on_human(true);  
        lastBtHumanState=HID_STATE_IN;
       }
      else{
        if(lastBtHumanState!==HID_STATE_OUT)
        {
          print(DEVICE_NAME,"You are OUT");
        }
        on_human(false); 
        lastBtHumanState=HID_STATE_OUT;
      }
     
      
 

  }

},null);
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    start_blink();
    evs = 'DISCONNECTED';
    status.sta_ip="0.0.0.0";
    diconnect_count++; 
    print(DEVICE_NAME,"Still Disconnected ",diconnect_count); 
    if(diconnect_count>=2  )
    {
      diconnect_count=0; 
      if(iotains[index]===DEVICE_NAME || iotains[index]===Cfg.get("wifi.sta.ssid"))
      {
        index++; 
      }
      if(index===iotains.length)
        index=0;
      print(DEVICE_NAME,"Connecting to ",iotains[index]);
      Cfg.set({wifi:{sta:{ssid:iotains[index++],pass:"password"}}});
      wifi_setup(); 
    } 
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) { 
    GPIO.write(led,1); 
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
    diconnect_count=0;
    stop_blink();
    GPIO.write(led,1); 
    if(reg_timer===-1)
    {
      Timer.del(reg_timer);
      reg_timer=-1;
    }
    timer_count=0;
    reg_timer=Timer.set(5000,Timer.REPEAT,function(args){
 
      if(timer_count++ >2)
      {
        Timer.del(reg_timer);
        reg_timer=-1;
        return;
      }
      get_info(); 
    },null);
     
  }
  print(DEVICE_NAME,'== Net event:', ev, evs);
  evs=undefined;
  gc(true);
}, null);
let upd_commit=function()
{
    let s={
      status:"COMMIED_OK"
    }; 
        File.write(JSON.stringify(s),"updater_data.json");
};
if(s.status==="TO_COMMIT")
{ 
  upd_commit();
  Sys.reboot(10);
}
s=undefined;
upd_commit();
gc(true);