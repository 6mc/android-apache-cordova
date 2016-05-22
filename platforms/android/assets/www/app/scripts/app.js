/*!
 * This file is part of App Builder
 * For licenses information see App Builder help
 * ©2016 App Builder - https://www.davidesperalta.com
 */

var
  AB_VIBR = 'animated shake',
  AB_DCTR = 'AppDialogsCtrl',
  AB_BEEP = 'builder/sounds/beep/beep',
  AB_ALTT = 'builder/views/alertBox.html',
  AB_NPTT = 'builder/views/inputBox.html',
  AB_MSGT = 'builder/views/messageBox.html',
  AB_IDLE = 'mousemove mousedown mousewheel keydown ' +
            'scroll touchstart touchmove DOMMouseScroll';

window.App = {};

window.App.Plugins = {};

window.App.Utils = (function() {

  var
    lastPlaySound = new Audio();

  return {

    strLen: function(text) {
      return text.length;
    },

    trimStr: function(text) {
      return text.trim();
    },

    strSearch: function(text, query) {
      return text.search(query);
    },

    splitStr: function(text, separator) {
      return text.split(separator);
    },

    subStr: function(text, start, count) {
      return text.substr(start, count);
    },

    strReplace: function(text, from, to) {
      return text.replace(from, to);
    },

    strReplaceAll: function(text, from, to) {
      return text.split(from).join(to);
    },

    playSound: function(mp3Url, oggUrl) {
      if (lastPlaySound.canPlayType('audio/mpeg')) {
        lastPlaySound.src = mp3Url;
        lastPlaySound.type = 'audio/mpeg';
      } else {
        lastPlaySound.src = oggUrl;
        lastPlaySound.type = 'audio/ogg';
      }
      lastPlaySound.play();
    },

    stopSound: function() {
      lastPlaySound.pause();
      lastPlaySound.currentTime = 0.0;
    },

    sleep: function(milliseconds) {
      var
        start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
          break;
        }
      }
    }
  };
})();

window.App.Modal = (function() {

  var
    stack = [],
    current = 0;

  return {

    insert: function(name) {
      current = stack.length;
      stack[current] = {};
      stack[current].name = name;
      stack[current].instance = null;
      return stack[current];
    },

    removeCurrent: function() {
      stack.slice(current, 1);
      current = current - 1;
      current = (current < 0) ? 0 : current;
    },

    currentInstance: function() {
      if (stack[current]) {
        return stack[current].instance;
      } else {
        return null;
      }
    },

    closeAll: function() {
      for (var i = stack.length-1; i >= 0; i--) {
        stack[i].instance.dismiss();
      }
      stack = [];
      current = 0;
    }
  };
})();

window.App.Debugger = (function() {

  return {

    isRunning: function() {
      return (typeof window.external === 'object')
       && ('hello' in window.external);
    },

    log: function(text, aType, lineNum) {
      if (window.App.Debugger.isRunning()) {
        external.log('' + text, aType || 'info', lineNum || 0);
      } else {
        console.log(text);
      }
    },

    watch: function(varName, newValue, oldValue) {
      if (window.App.Debugger.isRunning()) {
        if (angular.isArray(newValue)) {
          external.watch('', varName, newValue.toString(), 'array');
        } else if (angular.isObject(newValue)) {
          angular.forEach(newValue, function(value, key) {
            if (!angular.isFunction(value)) {
              try {
                external.watch(varName, key, value.toString(), typeof value);
              } catch(exception) {}
            }
          });
        } else if (angular.isString(newValue) || angular.isNumber(newValue)) {
          external.watch('', varName, newValue.toString(), typeof newValue);
        }
      }
    }
  };
})();

window.App.Module = angular.module
(
  'AppModule',
  [
    'ngRoute',
    'ngTouch',
    'ngSanitize',
    'blockUI',
    'chart.js',
    'ngOnload',
    'ui.bootstrap',
    'angular-canvas-gauge',
    'com.2fdevs.videogular',
    'com.2fdevs.videogular.plugins.controls',
    'AppCtrls'
  ]
);

window.App.Module.directive('ngImageLoad',
[
  '$parse',

  function($parse) {
    return {
      restrict: 'A',
      link: function($scope, el, attrs) {
        el.bind('load', function(event) {
          var
            fn = $parse(attrs.ngImageLoad);
          fn($scope, {$event: event});
        });
      }
    }
  }
]);

window.App.Module.directive('ngContextMenu',
[
  '$parse',

  function($parse) {
    return {
      restrict: 'A',
      link: function($scope, el, attrs) {
        el.bind('contextmenu', function(event) {
          var
            fn = $parse(attrs.ngContextMenu);
          fn($scope, {$event: event});
        });
      }
    }
  }
]);

window.App.Module.directive('bindFile',
[
  function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function($scope, el, attrs, ngModel) {
        el.bind('change', function(event) {
          ngModel.$setViewValue(event.target.files[0]);
          $scope.$apply();
        });

        $scope.$watch(function () {
          return ngModel.$viewValue;
        }, function(value) {
          if (!value) {
            el.val('');
          }
        });
      }
    }
  }
]);

window.App.Module.config
([
  '$compileProvider',

  function($compileProvider) {
    $compileProvider.debugInfoEnabled(window.App.Debugger.isRunning());
    $compileProvider.imgSrcSanitizationWhitelist
     (/^\s*(https?|blob|ftp|mailto|file|tel|app):/);
  }
]);

window.App.Module.config
([
  '$httpProvider',

  function($httpProvider) {
    if (!$httpProvider.defaults.headers.get) {
      $httpProvider.defaults.headers.get = {};
    }
    if (!$httpProvider.defaults.headers.post) {
      $httpProvider.defaults.headers.post = {};
    }
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    $httpProvider.defaults.headers.post['Content-Type'] = undefined;
    $httpProvider.defaults.transformRequest.unshift(function(data) {
      var
        frmData = new FormData();
      angular.forEach(data, function(value, key) {
        frmData.append(key, value);
      });
      return frmData;
    });
}]);

window.App.Module.config
([
  '$provide',

  function($provide) {
    $provide.decorator('$exceptionHandler',
    ['$injector',
      function($injector) {
        return function(exception, cause) {
          var
            $rs = $injector.get('$rootScope');

          if (!angular.isUndefined(cause)) {
            exception.message += ' (caused by "'+cause+'")';
          }

          $rs.App.LastError = exception.message;
          $rs.OnAppError();
          $rs.App.LastError = '';

          if (window.App.Debugger.isRunning()) {
            throw exception;
          } else {
            if (window.console) {
              window.console.error(exception);
            }
          }
        };
      }
    ]);
  }
]);

window.App.Module.config
([
  'blockUIConfig',

  function(blockUIConfig) {
    blockUIConfig.delay = 0;
    blockUIConfig.autoBlock = false;
    blockUIConfig.resetOnException = true;
    blockUIConfig.message = 'Please wait';
    blockUIConfig.autoInjectBodyBlock = false;
    blockUIConfig.blockBrowserNavigation = true;
  }
]);

window.App.Module.config
([
  '$routeProvider',

  function($routeProvider) {
    $routeProvider.otherwise({redirectTo: "/View1"})
    .when("/View1", {controller: "View1Ctrl", templateUrl: "app/views/View1.html"});
  }
]);

window.App.Module.service
(
  'AppEventsService',

  ['$rootScope',

  function($rootScope) {

    function setAppOnlineEvent() {
      window.addEventListener('online', function(event) {
        window.App.Event = event;
        $rootScope.OnAppOnline();
      }, false);
    }

    function setAppOfflineEvent() {
      window.addEventListener('offline', function(event) {
        window.App.Event = event;
        $rootScope.OnAppOffline();
      }, false);
    }

    function setAppResizeEvent() {
      window.addEventListener('resize', function(event) {
        window.App.Event = event;
        $rootScope.OnAppResize();
      }, false);
    }

    function setAppPauseEvent() {
      if (!window.App.Cordova) {
        document.addEventListener('pause', function(event) {
          window.App.Event = event;
          $rootScope.OnAppPause();
        }, false);
      }
    }

    function setAppReadyEvent() {
      if (window.App.Cordova) {
        angular.element(window.document).ready(function(event) {
          window.App.Event = event;
          $rootScope.OnAppReady();
        });
      } else {
        document.addEventListener('deviceready', function(event) {
          window.App.Event = event;
          $rootScope.OnAppReady();
        }, false);
      }
    }

    function setAppResumeEvent() {
      if (!window.App.Cordova) {
        document.body.addEventListener('resume', function(event) {
          window.App.Event = event;
          $rootScope.OnAppResume();
        }, false);
      }
    }

    function setAppBackButtonEvent() {
      if (!window.App.Cordova) {
        document.addEventListener('backbutton', function(event) {
          window.App.Event = event;
          $rootScope.OnAppBackButton();
        }, false);
      }
    }

    function setAppMenuButtonEvent() {
      if (!window.App.Cordova) {
        document.addEventListener('deviceready', function(event) {
          // http://stackoverflow.com/q/30309354
          navigator.app.overrideButton('menubutton', true);
          document.addEventListener('menubutton', function(event) {
            window.App.Event = event;
            $rootScope.OnAppMenuButton();
          }, false);
        }, false);
      }
    }

    function setAppOrientationEvent() {
      window.addEventListener('orientationchange', function(event) {
        window.App.Event = event;
        $rootScope.OnAppOrientation();
      }, false);
    }

    function setAppVolumeUpEvent() {
      if (!window.App.Cordova) {
        document.addEventListener('volumeupbutton', function(event) {
          window.App.Event = event;
          $rootScope.OnAppVolumeUpButton();
        }, false);
      }
    }

    function setAppVolumeDownEvent() {
      if (!window.App.Cordova) {
        document.addEventListener('volumedownbutton', function(event) {
          window.App.Event = event;
          $rootScope.OnAppVolumeDownButton();
        }, false);
      }
    }

    function setAppKeyUpEvent() {
      document.addEventListener('keyup', function(event) {
        window.App.Event = event;
        $rootScope.OnAppKeyUp();
      }, false);
    }

    function setAppKeyDownEvent() {
      document.addEventListener('keydown', function(event) {
        window.App.Event = event;
        $rootScope.OnAppKeyDown();
      }, false);
    }

    function setAppMouseUpEvent() {
      document.addEventListener('mouseup', function(event) {
        window.App.Event = event;
        $rootScope.OnAppMouseUp();
      }, false);
    }

    function setAppMouseDownEvent() {
      document.addEventListener('mousedown', function(event) {
        window.App.Event = event;
        $rootScope.OnAppMouseDown();
      }, false);
    }

    function setAppViewChangeEvent() {
      angular.element(window.document).ready(function(event) {
        $rootScope.$on('$locationChangeStart', function(event, next, current) {
          window.App.Event = event;
          $rootScope.App.NextView = next.substring(next.lastIndexOf('/') + 1);
          $rootScope.App.CurrentView = current.substring(current.lastIndexOf('/') + 1);
          $rootScope.OnAppViewChange();
        });
      });
    }

    return {
      init : function() {
        //setAppReadyEvent();
        //setAppPauseEvent();
        //setAppKeyUpEvent();
        //setAppResumeEvent();
        //setAppResizeEvent();
        //setAppOnlineEvent();
        //setAppKeyDownEvent();
        //setAppMouseUpEvent();
        //setAppOfflineEvent();
        //setAppVolumeUpEvent();
        //setAppMouseDownEvent();
        //setAppVolumeDownEvent();
        //setAppBackButtonEvent();
        //setAppMenuButtonEvent();
        //setAppViewChangeEvent();
        //setAppOrientationEvent();
      }
    };
  }
]);

window.App.Module.service
(
  'AppGlobalsService',

  ['$rootScope', '$filter',

  function($rootScope, $filter) {

    var setGlobals = function() {
      $rootScope.App = {};
      var s = function(name, method) {
        Object.defineProperty($rootScope.App, name, { get: method });
      };
      s('Online', function() { return navigator.onLine; });
      s('WeekDay', function() { return new Date().getDay(); });
      s('Event', function() { return window.App.Event || ''; });
      s('OuterWidth', function() { return window.outerWidth; });
      s('InnerWidth', function() { return window.innerWidth; });
      s('InnerHeight', function() { return window.innerHeight; });
      s('OuterHeight', function() { return window.outerHeight; });
      s('Timestamp', function() { return new Date().getTime(); });
      s('Day', function() { return $filter('date')(new Date(), 'dd'); });
      s('Fullscreen', function() { return BigScreen.element !== null; });
      s('Hour', function() { return $filter('date')(new Date(), 'hh'); });
      s('Week', function() { return $filter('date')(new Date(), 'ww'); });
      s('Month', function() { return $filter('date')(new Date(), 'MM'); });
      s('Year', function() { return $filter('date')(new Date(), 'yyyy'); });
      s('Hour24', function() { return $filter('date')(new Date(), 'HH'); });
      s('Minutes', function() { return $filter('date')(new Date(), 'mm'); });
      s('Seconds', function() { return $filter('date')(new Date(), 'ss'); });
      s('DayShort', function() { return $filter('date')(new Date(), 'd'); });
      s('WeekShort', function() { return $filter('date')(new Date(), 'w'); });
      s('HourShort', function() { return $filter('date')(new Date(), 'h'); });
      s('YearShort', function() { return $filter('date')(new Date(), 'yy'); });
      s('MonthShort', function() { return $filter('date')(new Date(), 'M'); });
      s('Hour24Short', function() { return $filter('date')(new Date(), 'H'); });
      s('MinutesShort', function() { return $filter('date')(new Date(), 'm'); });
      s('SecondsShort', function() { return $filter('date')(new Date(), 's'); });
      s('Milliseconds', function() { return $filter('date')(new Date(), 'sss'); });
      s('Cordova', function() {  return angular.isUndefined(window.App.Cordova) ? 'true' : 'false' });
      s('Orientation', function() { return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait'; });
      s('ActiveControl', function() { return (window.document.activeElement !== null) ? window.document.activeElement.id : '' });

      
$rootScope.App.IdleIsIdling = "false";
$rootScope.App.IdleIsRunning = "false";
$rootScope.App.ID = "com.mmcan";
$rootScope.App.Name = "Apologizer";
$rootScope.App.Version = "1.0.0";
$rootScope.App.Description = "Pls work !";
$rootScope.App.AuthorName = "Mehmet Can";
$rootScope.App.AuthorEmail = "mcanmutaf@outlook.com";
$rootScope.App.AuthorUrl = "https://www.github.com/";
$rootScope.App.Scaled = "fixed";
$rootScope.App.Theme = "Darkly";
$rootScope.App.Themes = ["Darkly"];
if ($rootScope.App.Themes.indexOf("Darkly") == -1) { $rootScope.App.Themes.push("Darkly"); }
$rootScope.LanguageCode = "en";
$rootScope.TextDirection = "ltr";
    };

    return {
      init : function() {
        setGlobals();
      }
    };
  }
]);

window.App.Module.service
(
  'AppControlsService',

  ['$rootScope', '$http', '$sce',

  function($rootScope, $http, $sce) {

    var setControlVars = function() {
      

$rootScope.Button1 = {};
$rootScope.Button1.Hidden = "";
$rootScope.Button1.Title = "";
$rootScope.Button1.TabIndex = -1;
$rootScope.Button1.TooltipText = "";
$rootScope.Button1.TooltipPos = "top";
$rootScope.Button1.PopoverText = "";
$rootScope.Button1.PopoverTitle = "";
$rootScope.Button1.PopoverEvent = "mouseenter";
$rootScope.Button1.PopoverPos = "top";
$rootScope.Button1.Badge = "";
$rootScope.Button1.Icon = "";
$rootScope.Button1.Text = "Look";
$rootScope.Button1.Class = "btn btn-default btn-xs ";
$rootScope.Button1.Disabled = "";
    };

    return {
      init : function() {
        setControlVars();
      }
    };
  }
]);

window.App.Module.service
(
  'AppPluginsService',

  ['$rootScope',

  function($rootScope) {

    var setupPlugins = function() {
      Object.keys(window.App.Plugins).forEach(function(plugin) {
        if (angular.isFunction(window.App.Plugins[plugin])) {
          plugin = window.App.Plugins[plugin].call();
          if (angular.isFunction(plugin.PluginSetupEvent)) {
            plugin.PluginSetupEvent();
          }
          if (angular.isFunction(plugin.PluginDocumentReadyEvent)) {
            angular.element(window.document).ready(
             plugin.PluginDocumentReadyEvent);
          }
          if (angular.isUndefined(window.App.Cordova) &&
           angular.isFunction(plugin.PluginAppReadyEvent)) {
             document.addEventListener('deviceready',
              plugin.PluginAppReadyEvent, false);
          }
        }
      });
    };

    return {
      init : function() {
        setupPlugins();
      }
    };
  }
]);

window.App.Ctrls = angular.module('AppCtrls', []);

window.App.Ctrls.controller
(
  'AppCtrl',

  ['$scope', '$rootScope', '$location', '$uibModal', '$http', '$sce', '$window', '$document',
    'AppEventsService', 'AppGlobalsService', 'AppControlsService', 'AppPluginsService',

  function($scope, $rootScope, $location, $uibModal, $http, $sce, $window, $document,
   AppEventsService, AppGlobalsService, AppControlsService, AppPluginsService) {

    window.App.Scope = $scope;
    window.App.RootScope = $rootScope;

    AppEventsService.init();
    AppGlobalsService.init();
    AppControlsService.init();
    AppPluginsService.init();

    $scope.showView = function(viewName) {
      window.App.Modal.closeAll();
      $rootScope.App.DialogView = '';
      $location.path(viewName);
    };

    $scope.replaceView = function(viewName) {
      window.App.Modal.closeAll();
      $rootScope.App.DialogView = '';
      $location.path(viewName).replace();
    };

    $scope.showModalView = function(viewName, callback) {
      var
        execCallback = null,
        modal = window.App.Modal.insert(viewName);

      $rootScope.App.DialogView = viewName;

      modal.instance = $uibModal.open
      ({
        size: 'lg',
        scope: $scope,
        keyboard: false,
        backdrop: 'static',
        windowClass: 'dialogView',
        controller: viewName + 'Ctrl',
        templateUrl: 'app/views/' + viewName + '.html'
      });
      execCallback = function(modalResult) {
        window.App.Modal.removeCurrent();
        if (angular.isFunction(callback)) {
          callback(modalResult);
        }
      };
      modal.instance.result.then(
        function(modalResult){execCallback(modalResult);},
        function(modalResult){execCallback(modalResult);}
      );
    };

    $scope.closeModalView = function(modalResult) {
      var
        modal = window.App.Modal.currentInstance();

      $rootScope.App.DialogView = '';

      if (modal !== null) {
        window.App.Modal.currentInstance().close(modalResult);
        window.App.Modal.removeCurrent();
      }
    };

    $scope.loadVariables = function(text) {

      var
        setVar = function(name, value) {
          var
            newName = '',
            dotPos = name.indexOf('.');

          if (dotPos != -1) {
            newName = name.split('.');
            if (newName.length === 2) {
              $rootScope[newName[0].trim()][newName[1].trim()] = value;
            } else if (newName.length === 3) {
              // We support up to 3 levels here
              $rootScope[newName[0].trim()][newName[1].trim()][newName[2].trim()] = value;
            }
          } else {
            $rootScope[name] = value;
          }
        };

      var
        lineLen = 0,
        varName = '',
        varValue = '',
        isArray = false,
        text = text || '',
        separatorPos = -1;

      angular.forEach(text.split('\n'), function(value, key) {
        separatorPos = value.indexOf('=');
        if (separatorPos != -1) {
          varName = value.substr(0, separatorPos).trim();
          if (varName != '') {
            varValue = value.substr(separatorPos + 1, value.length).trim();
            isArray = varValue.substr(0, 1) == '|';
            if (!isArray) {
              setVar(varName, varValue);
            } else {
              setVar(varName, varValue.substr(1, varValue.length).split('|'));
            }
          }
        }
      });
    };

    $scope.alertBox = function(content, type) {
      var
        aType = type || 'info',
        modal = window.App.Modal.insert(AB_ALTT);

      modal.instance = $uibModal.open
      ({
        size: 'sm',
        scope: $scope,
        keyboard: true,
        controller: AB_DCTR,
        templateUrl: AB_ALTT,
        resolve: {
          properties: function() {
            return {
              Type: aType,
              Content: content
            };
          }
        }
      });
      modal.instance.result.then(null, function() {
        window.App.Modal.removeCurrent();
      });
    };

    $scope.inputBox = function(header, buttons,
     inputVar, defaultVal, type, callback) {
      var
        execCallback = null,
        aType = type || 'info',
        aButtons = buttons || 'Ok|Cancel',
        modal = window.App.Modal.insert(AB_NPTT);

      $rootScope[inputVar] = defaultVal;

      modal.instance = $uibModal.open
      ({
        size: 'md',
        scope: $scope,
        keyboard: false,
        backdrop: 'static',
        controller: AB_DCTR,
        templateUrl: AB_NPTT,
        resolve: {
          properties: function() {
            return {
              Type: aType,
              Header: header,
              Buttons: aButtons.split('|'),
              InputVar: $rootScope.inputVar
            };
          }
        }
      });
      execCallback = function(modalResult) {
        window.App.Modal.removeCurrent();
        if (angular.isFunction(callback)) {
          callback(modalResult, $rootScope[inputVar]);
        }
      };
      modal.instance.result.then(
        function(modalResult){execCallback(modalResult);},
        function(modalResult){execCallback(modalResult);}
      );
    };

    $scope.messageBox = function(header,
     content, buttons, type, callback) {
      var
        execCallback = null,
        aType = type || 'info',
        aButtons = buttons || 'Ok',
        modal = window.App.Modal.insert(AB_MSGT);

      modal.instance = $uibModal.open
      ({
        size: 'md',
        scope: $scope,
        keyboard: false,
        backdrop: 'static',
        controller: AB_DCTR,
        templateUrl: AB_MSGT,
        resolve: {
          properties: function() {
            return {
              Type: aType,
              Header: header,
              Content: content,
              Buttons: aButtons.split('|')
            };
          }
        }
      });
      execCallback = function(modalResult) {
        window.App.Modal.removeCurrent();
        if (angular.isFunction(callback)) {
          callback(modalResult);
        }
      };
      modal.instance.result.then(
        function(modalResult){execCallback(modalResult);},
        function(modalResult){execCallback(modalResult);}
      );
    };

    $scope.alert = function(title, text) {
      if (window.App.Cordova) {
        window.alert(text);
      } else {
        navigator.notification.alert(
         text, null, title, null);
      }
    };

    $scope.confirm = function(title, text, callback) {
      if (window.App.Cordova) {
        callback(window.confirm(text));
      } else {
        navigator.notification.confirm
        (
          text,
          function(btnIndex) {
            callback(btnIndex === 1);
          },
          title,
          null
        );
      }
    };

    $scope.prompt = function(title, text, defaultVal, callback) {
      if (window.App.Cordova) {
        var
          result = window.prompt(text, defaultVal);
        callback(result !== null, result);
      } else {
        navigator.notification.prompt(
          text,
          function(result) {
            callback(result.buttonIndex === 1, result.input1);
          },
          title,
          null,
          defaultVal
        );
      }
    };

    $scope.beep = function(times) {
      if (window.App.Cordova) {
        window.App.Utils.playSound
        (
          AB_BEEP + '.mp3',
          AB_BEEP + '.ogg'
        );
      } else {
        navigator.notification.beep(times);
      }
    };

    $scope.vibrate = function(milliseconds) {
      if (window.App.Cordova) {
        var
          body = angular.element(document.body);
        body.addClass(AB_VIBR);
        setTimeout(function() {
          body.removeClass(AB_VIBR);
        }, milliseconds);
      } else {
        navigator.vibrate(milliseconds);
      }
    };

    $scope.setLocalOption = function(key, value) {
      window.localStorage.setItem(key, value);
    };

    $scope.getLocalOption = function(key) {
      return window.localStorage.getItem(key) || '';
    };

    $scope.removeLocalOption = function(key) {
      window.localStorage.removeItem(key);
    };

    $scope.clearLocalOptions = function() {
      window.localStorage.clear();
    };

    $scope.log = function(text, lineNum) {
      window.App.Debugger.log(text, lineNum);
    };

    $window.TriggerAppOrientationEvent = function() {
      $rootScope.OnAppOrientation();
      $rootScope.$apply();
    };

    $scope.idleStart = function(seconds) {

      $scope.idleStop();
      $rootScope.App.IdleIsIdling = false;

      if($rootScope.App._IdleSeconds != seconds) {
        $rootScope.App._IdleSeconds = seconds;
      }

      $document.on(AB_IDLE, $scope._resetIdle);

      $rootScope.App.IdleIsRunning = true;

      $rootScope.App._IdleTimer = setTimeout(function() {
        $rootScope.App.IdleIsIdling = true;
        $rootScope.OnAppIdleStart();
        $scope.$apply();
      }, $rootScope.App._IdleSeconds * 1000);
    };

    $scope._resetIdle = function() {
      if($rootScope.App.IdleIsIdling) {
        $rootScope.OnAppIdleEnd();
        $rootScope.App.IdleIsIdling = false;
        $scope.$apply();
      }
      $scope.idleStart($rootScope.App._IdleSeconds);
    };

    $scope.idleStop = function() {
      $document.off(AB_IDLE, $scope._resetIdle);
      clearTimeout($rootScope.App._IdleTimer);
      $rootScope.App.IdleIsRunning = false;
    };

    $scope.trustSrc = function(src) {
      return $sce.trustAsResourceUrl(src);
    };

    $scope.openWindow = function(url, showLocation) {
      var
        options = 'location=';

      if (showLocation) {
        options += 'yes';
      } else {
        options += 'no';
      }

      if (window.App.Cordova) {
        options += ', width=500, height=500, resizable=yes, scrollbars=yes';
      }

      return window.open(encodeURI(url), '_blank', options);
    };

    $scope.closeWindow = function(winRef) {
      if (angular.isObject(winRef) && angular.isFunction(winRef.close)) {
        winRef.close();
      }
    };

   
}]);

window.App.Ctrls.controller
(
  'AppDialogsCtrl',

  ['$scope', 'properties',

  function($scope, properties) {
    $scope.Properties = properties;
  }
]);

window.App.Ctrls.controller
(
  'AppEventsCtrl',

  ['$scope', '$rootScope', '$location', '$uibModal', '$http', '$sce', '$window', '$document', 'blockUI', '$uibPosition',

  function($scope, $rootScope, $location, $uibModal, $http, $sce, $window, $document, blockUI, $uibPosition) {

    $rootScope.OnAppReady = function() {
      //__APP_READY_EVENT
    };

    $rootScope.OnAppPause = function() {
      //__APP_PAUSE_EVENT
    };

    $rootScope.OnAppKeyUp = function() {
      //__APP_KEY_UP_EVENT
    };

    $rootScope.OnAppKeyDown = function() {
      //__APP_KEY_DOWN_EVENT
    };

    $rootScope.OnAppMouseUp = function() {
      //__APP_MOUSE_UP_EVENT
    };

    $rootScope.OnAppMouseDown = function() {
      //__APP_MOUSE_DOWN_EVENT
    };

    $rootScope.OnAppError = function() {
      //__APP_ERROR_EVENT
    };

    $rootScope.OnAppResize = function() {
      //__APP_RESIZE_EVENT
    };

    $rootScope.OnAppResume = function() {
      //__APP_RESUME_EVENT
    };

    $rootScope.OnAppOnline = function() {
      //__APP_ONLINE_EVENT
    };

    $rootScope.OnAppOffline = function() {
      //__APP_OFFLINE_EVENT
    };

    $rootScope.OnAppIdleEnd = function() {
      //__APP_IDLE_END_EVENT
    };

    $rootScope.OnAppIdleStart = function() {
      //__APP_IDLE_START_EVENT
    };

    $rootScope.OnAppBackButton = function() {
      //__APP_BACK_BUTTON_EVENT
    };

    $rootScope.OnAppMenuButton = function() {
      //__APP_MENU_BUTTON_EVENT
    };

    $rootScope.OnAppViewChange = function() {
      //__APP_VIEW_CHANGE_EVENT
    };

    $rootScope.OnAppOrientation = function() {
      //__APP_ORIENTATION_EVENT
    };

    $rootScope.OnAppVolumeUpButton = function() {
      //__APP_VOLUME_UP_EVENT
    };

    $rootScope.OnAppVolumeDownButton = function() {
      //__APP_VOLUME_DOWN_EVENT
    };
  }
]);

angular.element(window.document).ready(function() {
  angular.bootstrap(window.document, ['AppModule']);
});

App.Ctrls.controller("View1Ctrl", ["$scope", "$rootScope", "$sce", "$interval", "$http", "$uibPosition", "blockUI",

function($scope, $rootScope, $sce, $interval, $http, $position, blockUI) {

$rootScope.View1 = {};

window.App.View1 = {};

window.App.View1.Scope = $scope;

$rootScope.App.CurrentView = "View1";

angular.element(window.document).ready(function(event){
angular.element(document.querySelector("body")).addClass($rootScope.App.Theme.toLowerCase());
});

$scope.Button1Click = function($event) {
$rootScope.Button1.Event = $event;

$scope.alertBox("i\x27m sorry", "success");

};

}]);
