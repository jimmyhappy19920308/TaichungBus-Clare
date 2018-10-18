var data = [];
var data2 = [];

var direction = 'go';

var helper = {
  getParameterByName: function(name, url) {
    var regex, results;
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, '\\$&');
    regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)', 'i');
    results = regex.exec(url);
    if (!results) {
      return null;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
};
var roadLine = helper.getParameterByName("Zh_tw");
//console.log(roadLine);

var bustimeList = document.querySelector('.bustimeList');
var address = document.querySelector('.address');
var destination = document.querySelector('.destination');
var go = document.querySelector('.go');
var come = document.querySelector('.come');

go.addEventListener('click',function(){
  direction = 'go';
  //console.log(direction);
  getBusInfo();
});
come.addEventListener('click',function(){
  direction = 'come';
  //console.log(direction);
  getBusInfo();
});

address.innerHTML = roadLine;

function getBusInfo(){
  if(direction == 'go'){
    var url = `https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taichung?$filter=RouteName%2FZh_tw%20eq%20%27${roadLine}%27%20and%20Direction%20eq%20%270%27&$orderby=StopSequence%20asc&$top=100&$format=JSON`;
    var xhr = new XMLHttpRequest();
    xhr.open('get', url);
    xhr.send(null);
    xhr.onload = function() {
      if (xhr.status == 200) { //http狀態碼=200執行程式碼
        data = JSON.parse(xhr.responseText);
        //console.log(data);
    
        function updateList(items) {
          var len = items.length;
          //console.log(len);
          
          var str = '';
  
          for (var i = 0; i < len; i++) {
            //console.log(go);
            go.value = `往${items[len-1].StopName.Zh_tw}`;
            come.value = `往${items[0].StopName.Zh_tw}`;
            var Time = Math.floor(items[i].EstimateTime / 60);
            if(items[i].EstimateTime == undefined){
              str += `
                <li>
                  <div class="ball rounded-circle"></div>
                  <span class="eTime first">過站
                    <span class="stop">${items[i].StopName.Zh_tw}</span>
                  </span>
                </li>
              `;
            }else if(items[i].EstimateTime < 0){
              str += `
                <li>
                  <div class="ball rounded-circle red"></div>
                  <span class="redTime eTime first ">停駛
                    <span class="stop">${items[i].StopName.Zh_tw}</span>
                  </span>
                </li>
              `;
            }else if(items[i].EstimateTime){
              str += `
                <li>
                  <div class="ball rounded-circle"></div>
                  <span class="eTime first">${Time}分
                    <span class="stop">${items[i].StopName.Zh_tw}</span>
                  </span>
                </li>
              `;
            }else if(items[i].EstimateTime == 0){
              str += `
                <li>
                  <div class="bus">
                    <i class="fa fa-bus busIcon" aria-hidden="true"></i>
                    <br>
                    <p class="busNumber">${items[i].PlateNumb}</p>
                  </div>          
                  <div class="ball rounded-circle red"></div>  
                  <span class="redTime eTime first ">進站中
                    <span class="stop">${items[i].StopName.Zh_tw}</span>
                  </span>
                </li>
              `;
            }
    
          }
          bustimeList.innerHTML = str;
        }
    
        updateList(data);
      } 
    }
  }else{
    var url = `https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taichung?$filter=RouteName%2FZh_tw%20eq%20%27${roadLine}%27%20and%20Direction%20eq%20%271%27&$orderby=StopSequence%20asc&$top=100&$format=JSON`;
    var xhr2 = new XMLHttpRequest();
    xhr2.open('get', url);
    xhr2.send(null);
    xhr2.onload = function() {
      if (xhr2.status == 200) { //http狀態碼=200執行程式碼
        data2 = JSON.parse(xhr2.responseText);
        //console.log(data2);
        function updateList(items) {
          var len = items.length;
          //console.log(len);
          
          var str = '';
          for (var i = 0; i < len; i++) {
            //console.log(go);

            var Time = Math.floor(items[i].EstimateTime / 60);
            if(items[i].EstimateTime == undefined){
              str += `
                <li>
                  <div class="ball rounded-circle"></div>
                  <span class="eTime first">過站
                    <span class="stop">${items[i].StopName.Zh_tw}</span>
                  </span>
                </li>
              `;
            }else if(items[i].EstimateTime < 0){
              str += `
                <li>
                  <div class="ball rounded-circle red"></div>
                  <span class="redTime eTime first ">停駛
                    <span class="stop">${items[i].StopName.Zh_tw}</span>
                  </span>
                </li>
              `;
            }else if(items[i].EstimateTime){
              str += `
                <li>
                  <div class="ball rounded-circle"></div>
                  <span class="eTime first">${Time}分
                    <span class="stop">${items[i].StopName.Zh_tw}</span>
                  </span>
                </li>
              `;
            }else if(items[i].EstimateTime == 0){
              str += `
                <li>
                  <div class="bus">
                    <i class="fa fa-bus busIcon" aria-hidden="true"></i>
                    <br>
                    <p class="busNumber">${items[i].PlateNumb}</p>
                  </div>          
                  <div class="ball rounded-circle red"></div>  
                  <span class="redTime eTime first ">進站中
                  <span class="stop">${items[i].StopName.Zh_tw}</span>
                  </span>
                </li>
              `;
            }
    
          }
          bustimeList.innerHTML = str;
        }
    
        updateList(data2);
      } 
    }
  }
}

getBusInfo();
setInterval(getBusInfo, 30000);