let $rootScope = GetRootScope();
let _modPath;

const io = require('socket.io-client');

let SCMP = {
	Server: null,
	isConnected: false,
	isConnecting: false,
	serverIP: null,
	connectErrors: 0,
	socket: null
};

exports.initialize = (modPath) => {
	_modPath = modPath;

	//let socket = io('http://localhost:55555');

	$rootScope.$on(Enums.GameEvents.SpeedChange, (a, b) => {
		console.log('höhö', $rootScope.settings.state, $rootScope.settings.paused);
	});
	$rootScope.$watch('settings.paused', (newValue, oldValue) => {
		console.log('XD change', newValue, oldValue);
	});

	// Add new menu item
	Modding.setMenuItem({
		name: 'scmp',
		tooltip: 'Multiplayer',
		tooltipPosition: 'top',
		faIcon: 'fa-globe',
		badgeCount: 0
	});

	// Define custom views
	exports.views = [{
		name: 'scmp',
		viewPath: _modPath + 'scmp.html',
		controller: ['$rootScope', '$scope', '$timeout', function ($rootScope, $scope, $timeout) {
			$scope.GetLocalized = Helpers.GetLocalized;
			$scope.ctrl = {
				error: null,
				tab: 'start'
			};

			// scmpCtrl
			this.isConnecting = SCMP.isConnecting;
			this.isConnected = SCMP.isConnected;
			this.error = '';
			this.isServer = SCMP.Server !== null;

			this.model = {
				connect: {
					ip: SCMP.serverIP
				},
				create: {
					port: 25565
				}
			};

			this.disconnect = () => {
				SCMP.socket.close();

				this.isConnected = SCMP.isConnected = false;
			};
			this.startServer = () => {
				this.isServer = true;

				SCMP.Server = require('socket.io')(this.model.create.port);
				SCMP.Server.sockets.on('connection', function (socket) {
					console.log('new connection', socket.handshake.query.name);
				});
			};
			this.stopServer = () => {
				SCMP.Server.close();

				SCMP.Server = null;
				this.isServer = false;
			};
			this.connect = function (){
				if (SCMP.isConnecting || SCMP.Server !== null) {
					return false;
				}

				this.isConnecting = true;
				SCMP.isConnecting = true;

				SCMP.connectErrors = 0;
				SCMP.serverIP = this.model.connect.ip;
				SCMP.socket = io('http://' + SCMP.serverIP, {
					query: {
						name: $rootScope.settings.companyName
					},
					timeout: 10000
				});

				$timeout(() => {
					console.log('timeout over');
					$scope.ctrl.error = 'XD';
					this.error = 'this XD';
				}, 2000);

				SCMP.socket
				    .on('connect', () => {
					    this.isConnecting = false;
					    SCMP.isConnecting = false;

					    this.isConnected = true;
					    SCMP.isConnected = true;
				    })
				    .on('disconnect', () => {
					    this.isConnected = false;
					    SCMP.isConnected = false;

					    SCMP.socket.close();
				    })
				    .on('connect_error', () => {
					    SCMP.connectErrors++;
					    //$scope.error = 'Verbindung zum Server fehlgeschlagen. Es wird erneut versucht eine Verbindung herzustellen. (Versuch #' + SCMP.connectErrors + '/3)';

					    $timeout(() => {
						    this.error = 'XD';
					    },0)

					    //$scope.$apply();
				        console.log('connection failed');

					    if (SCMP.connectErrors >= 3) {
					    	console.log('stop connecting ...');
						    this.isConnecting = false;
						    SCMP.isConnecting = false;
						    SCMP.socket.close();
					    }
				    });
			};
		}]
	}];
};

exports.onLoadGame = settings => {
	//set translations for new products
	if ($rootScope.options.language == 'de') {
		//German Language selected
		Language['scmp_title'] = 'Startup Company Mehrspieler';
		Language['scmp_connect'] = 'Verbinden';
		Language['scmp_disconnect'] = 'Verbindung trennen';
		Language['scmp_players'] = 'Spielerliste';
		Language['scmp_server_start'] = 'Server starten';
		Language['scmp_server_stop'] = 'Server stoppen';
		Language['scmp_connect_enter_serverip'] = 'Server IP (Beispiel: 127.0.0.1 oder localhost)';
	}
	else {
		//Default language
	}

	Language['scmp_create_enter_port'] = 'Port';
};