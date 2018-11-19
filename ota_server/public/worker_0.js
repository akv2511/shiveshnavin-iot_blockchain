load('api_sys.js'); 
load('api_wifi.js'); 
load('api_config.js'); 
load('api_http.js'); 
load('api_events.js'); 
load('api_rpc.js'); 
load('api_file.js'); 
load('api_gpio.js');  

let DEVICE_NAME=Cfg.get("device.id");  
let DEVICE_NO=DEVICE_NAME.slice(7, 8); 
if(DEVICE_NAME==="iotain_0")
{
  DEVICE_NO="0";
  DEVICE_NAME="iotain_"+DEVICE_NO;
  Cfg.set({device:{id:DEVICE_NAME}});
}   
let led =5; 
let led2=4;
let isEsp=DEVICE_NAME==="iotain_3" || DEVICE_NAME==="iotain_0" || DEVICE_NAME==="iotain_4";
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
print(DEVICE_NAME,'===',Cfg.get("device.id"),"===");

let wifi_setup=ffi('void change_wifi()');
let iotains=["iotain_0","iotain_1","iotain_2","iotain_3","iotain_4"];
if(s.status==="TO_COMMIT")
{
  print(DEVICE_NAME,"Updating Device Config");
  Cfg.set({wifi:{ap:AP}});
  Cfg.set({device:{id:DEVICE_NAME}}); 
  if(iotains[0]===DEVICE_NAME)
  {
    Cfg.set({wifi:{sta:{ssid:"Swati_Niwas",pass:"mother1919",enable:true},sta_connect_timeout:(10)}}); 
  }
  else{

    Cfg.set({wifi:{sta:{ssid:iotains[0],pass:"password",enable:true},sta_connect_timeout:(10) }}); 
     
  } 
}  
read_data=undefined; 
AP=undefined;
gc(true); 

/***************************/

let LOW=0;
let HIGH=1;
let gpio_map=[0,12,16,14,4,5,13];
for(let i=0;i<gpio_map.length;i++)
{
    GPIO.set_mode(gpio_map[i],GPIO.MODE_OUTPUT);
    GPIO.write(gpio_map[i],LOW);
}
// K M N Q R S X Z 
/***
 * S
 * |===|
 * |   |
 * |   |
 * 
 * X
 * |   |
 * |===|
 * |   |
 * 
 * Z
 * |   |
 * |   |
 * |===|
 * 
 * M
 * |   |
 * |===|
 * |===|
 * 
 * N
 * |===
 * |===
 * |===
 * 
 * Q
 * |===|
 * |===|
 * |   |
 * 
 * R
 *  ===|
 *  ===|
 *  ===|
 * 
 * K
 * |===|
 * |===|
 * |===| /\/\/\
 *  
 */
let char_map={
    "H":[1,6,3,4],
    "A":[1,2,3,4,6],
    "P":[1,2,3,6],
    "Y":[1,3,6],
    "D":[1,2,3,4,5],
    "I":[1],
    "W":[1,3,4,5],
    "L":[1,5],
    "B":[1,2,3,4,5],
    "C":[1,2,5],
    "E":[1,2,6,5],
    "F":[1,2,6],
    "G":[1,2,5,6,6],
    "J":[2,3,4,5],
    "O":[1,2,3,4,5],
    "T":[1,6,5],
    "U":[1,3,4,5],
    "K":[0,1,2,3,4,5,6],
    "M":[1,3,4,5,6],
    "N":[1,2,5,6],
    "Q":[1,2,3,4,6],
    "R":[2,3,4,5,6],
    "S":[1,2,3,4],
    "X":[1,3,4,6],
    "Z":[1,3,4,5],
    "-":[]

};

let cStr="";
let cIndex=1;
let cDelay=300;
let cTimer=-1;
let set_chars=function(str,delay)
{
    cStr=JSON.stringify(str);
    cIndex=1;
    cDelay=delay; 
    
    print("Setting ",cStr);

    if(cTimer!==-1)
    {
        Timer.del(cTimer);
        cTimer=-1;
    }
    cTimer=Timer.set(cDelay,1,function(args){

        if(cIndex >= cStr.length-1)
        {
            cIndex=1;
        }

        let cr=cStr.slice(cIndex,cIndex+1);
        cIndex++;
        let arr=char_map[cr]; 
        if(arr===undefined)
        return;
        

        print("Character ",cr," Map : ",JSON.stringify(arr));
 
        for(let k=1;k<gpio_map.length;k++)
        {
            let found=false;
            for(let l=0;l<arr.length;l++)
            {
                if(JSON.stringify(arr[l])===JSON.stringify(k))
                {
                    found=true;
                    break;
                }
            }
            if(!found)
            {
                print("Set ",k," GPIO ",gpio_map[k]," LOW");
                GPIO.write(gpio_map[k],LOW);
               
            }
           
        }
        for(let j=0;j<arr.length;j++)
        {
            print("Set ",arr[j]," GPIO ",gpio_map[arr[j]]," HIGH");
            GPIO.write(gpio_map[arr[j]],HIGH);
        } 


    },null);
    
        
    
    
};
set_chars("HAPYDIWALI",2000);

RPC.addHandler('set_chars',function(req)
{
    
    set_chars(req.string,req.delay);
    return {status:"Setting"};
});

RPC.addHandler('set_gpio',function(args){


    if(cTimer!==-1)
    {
        Timer.del(cTimer);
        cTimer=-1;
        Sys.usleep(cDelay+100);
    }
    if(args.pin===undefined || args.val===undefined)
    {
        return {status:"Undefinde data"};
    }
    GPIO.write(args.pin,args.val);
    print("Setting Pin : ",args.pin," Val : ",args.val);

    return {status:"Val set"};

});


RPC.addHandler('set_status',function(args){


    if(cTimer!==-1)
    {
        Timer.del(cTimer);
        cTimer=-1;
        Sys.usleep(cDelay+100);
    }
    for(let i=0;i<gpio_map.length;i++)
    {
        GPIO.write(gpio_map[i],args.status);
    }
    
    return {status:"Status Set"};

});
/*
    cIndex=0;
    Timer.set(1000,1,function(a){

        if(cIndex===gpio_map.length)
        {
            cIndex=1;
        }
        GPIO.toggle(gpio_map[cIndex]);
        print(gpio_map[cIndex++]);
        Sys.usleep(1000);
        
    },null);
    
 */


/***************************/

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

