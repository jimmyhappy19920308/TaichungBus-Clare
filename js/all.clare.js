/*
new functionName() 後，這個函數會變成物件
函數裡面透過 this 定義的 function expression 會變成物件的方法，
function FirebaseUser 先定義 listenChange、login、logout、addOrRemoveFavorite method：
listenChange 會先判斷 _changeHandlers 陣列中是否有成員，如果沒有就將 參數 handler 傳入陣列中，
login 透過  Firebase 的 auth.FacebookAuthProvider method (Firebase 提供的第三方登入 API) 來登入，login 錯誤時也有對應的錯誤提示，
logout 登出  ，
addOrRemoveFavorite 依據 favoriteRouteUID 陣列中是否已經存在 routeUID 
如果 routeUID 不存在則將 routeUID 加進 Firebase DB 使用者的最愛清單中
反之透過 _RouteUIDKey[routeUID] 來刪除 Firebase DB 使用者的最愛清單中的 routeUID(最愛路線)，
*/

function FirebaseUser() {
  var _this = this;  // 
  var _changeHandlers = [];
  var _RouteUIDKey = {};
  var _uid;
  var _store;
  _this.user;

  _this.favoriteRouteUID = [];
  _this.listenChange = function(handler, auto) {
    if (handler instanceof Function && _changeHandlers.indexOf(handler) == -1) {
      _changeHandlers.push(handler);
      // if (auto) {
      //   handler();
      // }
    }
  };
  _this.login = function() {
    if (firebase.auth().currentUser) {
      return;
    }
    var provider = new firebase.auth.FacebookAuthProvider();
    provider.addScope('email');
    firebase
      .auth()
      .signInWithPopup(provider)
      .then(function(result) {
        var token = result.credential.accessToken;
        var user = result.user;
        // console.log(token, user);
      })
      .catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        var email = error.email;
        var credential = error.credential;
        if (errorCode === 'auth/account-exists-with-different-credential') {
          alert(
            'You have already signed up with a different auth provider for that email.'
          );
        } else {
          console.error(error);
        }
      });
  };

  _this.logout = function() {
    firebase.auth().signOut();
  };
  _this.addOrRemoveFavorite = function(routeUID) {
    var index = _this.favoriteRouteUID.indexOf(routeUID);
    if (index == -1) {
      _this.favoriteRouteUID.push(routeUID);
      _store.child('Favorite').push({
        RouteUID: routeUID
      });
    } else {
      _this.favoriteRouteUID.splice(index, 1);
      _store
        .child('Favorite')
        .child(_RouteUIDKey[routeUID])
        .remove();
    }
  };

  _init();

  function _init() {
    firebase.auth().onAuthStateChanged(_onAuthStateChanged);
  }

  function _onAuthStateChanged(user) {
    // console.log('_onAuthStateChanged');
    if (!user || user.isAnonymous) {
      _uid = undefined;
      _this.user = undefined;
      _this.favoriteRouteUID = [];
      _RouteUIDKey = {};
      _store = undefined;
      for (var i in _changeHandlers) {
        // console.log(i);
        _changeHandlers[i]();
      }
    } else {
      _this.user = user;
      _uid = user.uid;
      _store = firebase.database().ref(_uid);
      _store.child('Favorite').on('value', function(snapshot) {
        // console.log(snapshot.val());
        _this.favoriteRouteUID = [];
        _RouteUIDKey = {};
        var RouteUID;
        snapshot.forEach(function(data) {
          RouteUID = data.val().RouteUID;
          // console.log(RouteUID);
          _RouteUIDKey[RouteUID] = data.key;
          // console.log(_RouteUIDKey);
          _this.favoriteRouteUID.push(RouteUID);
        });
        for (var i in _changeHandlers) {
          // console.log(i);
          _changeHandlers[i]();
        }
      });
    }
  }
}



/**
 *
 *
 */
function IndexView() {
  var _this = this;
  var _firebaseUser = new FirebaseUser();
  var _favoriteClassName = 'fa fa-heart add';
  var _notFavoriteClassName = 'fa fa-heart-o add';

  var _signInButton;
  var _signOutButton;
  var _fbNameElement;
  var _searchBusInput;
  var _favoriteElement;

  var _listElement;
  var _liElements = [];
  var _iElements = [];
  var _busInfos = [];
  var _name;
  var _favoriteRouteUID;

  _init();

  function _init() {
    _name = localStorage['_name'];
    _favoriteRouteUID = localStorage['_favoriteRouteUID'];

    if (_favoriteRouteUID) {
      _favoriteRouteUID = JSON.parse(_favoriteRouteUID);
      // console.log(_favoriteRouteUID);
    } else {
      _favoriteRouteUID = [];
    }

    initView();

    _queryBusInfo();

    _firebaseUser.listenChange(_onChange);
    _searchBusInput.addEventListener('input', _filter);
    _signInButton.addEventListener('click', _login);
    _signOutButton.addEventListener('click', _logout);
  }

  function _filter() {
    var value = _searchBusInput.value;

    if (value) {
      value = value.toUpperCase();
      for (var index in _busInfos) {
        if (_busInfos[index].SubRoutes[0].SubRouteName.Zh_tw.indexOf(value) == 0) {
          _liElements[index].style.display = 'block';
        } else {
          _liElements[index].style.display = 'none';
        }
      }
    } else {
      for (var index in _liElements) {
        _liElements[index].style.display = 'block';
      }
    }
  }

  function _login() {
    _firebaseUser.login();
  }

  function _logout() {
    _firebaseUser.logout();
  }

  function _onFavoriteClick(busInfo, e) {
    if (!_firebaseUser.user) {
      alert('請先登入');
      _login();
      return;
    }

    _firebaseUser.addOrRemoveFavorite(busInfo.RouteUID);
  }


  /*
   */
  function _onChange() {
    _favoriteRouteUID = _firebaseUser.favoriteRouteUID;
    localStorage['_favoriteRouteUID'] = JSON.stringify(_favoriteRouteUID);

    _updateBusInfoList();

    if (!_firebaseUser.user) {
      _signOutButton.style.display = 'none';
      _signInButton.style.display = 'block';
      _fbNameElement.style.display = 'none';
      _fbNameElement.innerText = '';
      _name = '';
    } else {
      _signOutButton.style.display = 'block';
      _signInButton.style.display = 'none';
      _fbNameElement.style.display = 'block';
      _name = '歡迎' + _firebaseUser.user.displayName;
    }

    localStorage['_name'] = _name;
    _fbNameElement.innerText = _name;
  }

  function _queryBusInfo() {
    var xhr = new XMLHttpRequest();
    xhr.open(
      'get',
      'https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/Taichung?$top=300&$format=JSON',
      true
    );
    xhr.onload = _queryBusInfoCallback.bind(xhr);
    xhr.send();
  }

  function _queryBusInfoCallback(e) {
    if (this.responseText == localStorage['_busInfos']) {
      return;
    }
    localStorage['_busInfos'] = this.responseText;
    _busInfos = JSON.parse(this.responseText);
    _createBusInfoList();
  }

  function _updateBusInfoList() {
    var favorite = document.createDocumentFragment();
    var temp = document.createDocumentFragment();
    var busInfo;

    for (var index in _busInfos) {
      busInfo = _busInfos[index];
      if (_favoriteRouteUID.indexOf(busInfo.RouteUID) == -1) {
        temp.appendChild(_liElements[index]);
        _iElements[index].className = _notFavoriteClassName;
      } else {
        favorite.appendChild(_liElements[index]);
        _iElements[index].className = _favoriteClassName;
      }
    }

    _favoriteElement.appendChild(favorite);
    _listElement.appendChild(temp);
  }

  function _createBusInfoList() {
    if (!_busInfos || _busInfos.length == 0) {
      return;
    }

    _liElements = [];
    _iElements = [];
    _RouteUIDIndex = {};

    var favorite = document.createDocumentFragment();
    var temp = document.createDocumentFragment();
    var li, i, a, span1, span2, busInfo;

    for (var index in _busInfos) {
      busInfo = _busInfos[index];
      li = document.createElement('li');
      i = document.createElement('i');
      a = document.createElement('a');
      span1 = document.createElement('span');
      span2 = document.createElement('span');

      i.addEventListener('click', _onFavoriteClick.bind(i, busInfo));

      a.href = 'selectbusInfo.html?Zh_tw=' + busInfo.SubRoutes[0].SubRouteName.Zh_tw;
      a.className = 'busLink';
      span1.className = 'Headsign a';
      span1.innerText = busInfo.SubRoutes[0].Headsign;
      span2.className = 'RouteId';
      span2.innerText = busInfo.SubRoutes[0].SubRouteName.Zh_tw;

      li.appendChild(i);
      li.appendChild(a);
      a.appendChild(span1);
      a.appendChild(document.createElement('br'));
      a.appendChild(span2);

      if (_favoriteRouteUID.indexOf(busInfo.RouteUID) == -1) {
        temp.appendChild(li);
        i.className = _notFavoriteClassName;
      } else {
        favorite.appendChild(li);
        i.className = _favoriteClassName;
      }
      _liElements.push(li);
      _iElements.push(i);
    }

    _listElement.innerHTML = '';
    _listElement.appendChild(temp);
    _favoriteElement.appendChild(favorite);
  }

  function initView() {
    var header = document.createElement('div');

    header.className = 'header';
    _signInButton = document.createElement('button');
    _signInButton.className = 'btn btn-primary';
    _signInButton.id = 'quickstart-sign-in';
    _signInButton.innerText = '登入';

    header.appendChild(_signInButton);

    _signOutButton = document.createElement('button');
    _signOutButton.className = 'btn btn-primary';
    _signOutButton.id = 'quickstart-sign-out';
    _signOutButton.innerText = '登出';

    header.appendChild(_signOutButton);

    if (_name) {
      _signInButton.style.display = 'none';
    } else {
      _signOutButton.style.display = 'none';
    }

    _fbNameElement = document.createElement('span');
    _fbNameElement.id = 'fbName';
    _fbNameElement.innerText = _name;

    var h1 = document.createElement('h1');
    h1.innerText = '台中市公車動態資訊';

    var address = document.createElement('div');
    address.className = 'address';
    address.innerText = '台中市台灣大道二段2號';

    var selectBus = document.createElement('div');
    selectBus.className = 'selectBus';
    selectBus.innerText = '請選擇公車';

    _searchBusInput = document.createElement('input');
    _searchBusInput.className = 'searchBus';
    _searchBusInput.placeholder = '請搜尋公車路線...';

    // header.appendChild(_signInButton);
    // header.appendChild(_signOutButton);
    header.appendChild(_fbNameElement);
    header.appendChild(document.createElement('br'));
    header.appendChild(h1);
    header.appendChild(address);
    header.appendChild(selectBus);
    header.appendChild(_searchBusInput);

    var content = document.createElement('div');
    content.className = 'content';

    _favoriteElement = document.createElement('ul');
    _favoriteElement.className = 'favorite';

    _listElement = document.createElement('ul');
    _listElement.className = 'list';

    content.appendChild(_favoriteElement);
    content.appendChild(_listElement);

    _busInfos = localStorage['_busInfos'];

    if (_busInfos) {
      _busInfos = JSON.parse(_busInfos);
      _createBusInfoList();
    }

    document.body.innerHTML = '';
    document.body.appendChild(header);
    document.body.appendChild(content);
  }
}
