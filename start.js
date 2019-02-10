const io = require('socket.io-client');

let _modPath;
let SCMP = {
	Server: null,
	Socket: null,
	isConnected: false,
	isConnecting: false,
	serverIP: null,
	connectErrors: 0
};
let $rootScope = GetRootScope();

function createConnection(ip) {
	SCMP.Socket = io('http://' + ip, {
		query: {
			name: $rootScope.settings.companyName
		},
		timeout: 10000
	});
}

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
			$scope.$parent.ctrl = {
				error: null,
				tab: 'start'
			};

			// scmpCtrl
			this.isConnecting = SCMP.isConnecting;
			this.isConnected = SCMP.isConnected;
			this.error = null;
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
				SCMP.Socket.close();

				this.isConnected = SCMP.isConnected = false;
			};
			this.startServer = () => {
				this.isServer = true;
				this.error = null;
				this.isConnected = SCMP.isConnected = true;

				SCMP.Server = require('socket.io')(this.model.create.port);
				SCMP.Server.sockets.on('connection', function (socket) {
					console.log('new connection', socket.handshake.query.name);

					// todo send player list to connected client :)
					//socket.emit('playerlist');
				});

				// owner connect as player to handle owner as player
				createConnection('localhost:' + this.model.create.port);
			};
			this.stopServer = () => {
				// close socket and server
				SCMP.Socket.close();
				SCMP.Server.close();
				SCMP.Server = null;

				this.isServer = false;
				this.isConnected = SCMP.isConnected = false;
			};
			this.connect = function () {
				if (SCMP.isConnecting || SCMP.Server !== null) {
					return false;
				}

				this.error = null;

				SCMP.isConnecting = this.isConnecting = true;
				SCMP.connectErrors = 0;
				SCMP.serverIP = this.model.connect.ip;

				createConnection(SCMP.serverIP);

				SCMP.Socket
				    .on('connect', () => {
					    SCMP.isConnecting = this.isConnecting = false;
					    SCMP.isConnected = this.isConnected = true;
				    })
				    .on('disconnect', () => {
					    SCMP.isConnected = this.isConnected = false;
					    SCMP.Socket.close();
				    })
				    .on('connect_error', () => {
					    $timeout(() => {
						    SCMP.connectErrors++;

						    if (SCMP.connectErrors >= 3) {
							    this.isConnecting = false;
							    this.error = Helpers.GetLocalized('scmp_connect_failed');

							    SCMP.isConnecting = false;
							    SCMP.Socket.close();
						    }
						    else {
							    this.error = Helpers.GetLocalized('scmp_connect_failed_retry', {try: SCMP.connectErrors});
						    }
					    }, 0);
				    });
			};
		}]
	}];
};

exports.onLoadGame = settings => {
	//set translations for new products
	if ($rootScope.options.language === 'de') {
		//German Language selected
		Language['scmp_title'] = 'Startup Company Mehrspieler';
		Language['scmp_connect'] = 'Verbinden';
		Language['scmp_disconnect'] = 'Verbindung trennen';
		Language['scmp_players'] = 'Spielerliste';
		Language['scmp_server_start'] = 'Server starten';
		Language['scmp_server_stop'] = 'Server stoppen';
		Language['scmp_connect_enter_serverip'] = 'Server IP (Beispiel: 127.0.0.1 oder localhost)';
		Language['scmp_connect_failed_retry'] = 'Zum Server konnte keine Verbindung hergestellt werden. Versuch {try}/3';
		Language['scmp_connect_failed'] = 'Zum Server konnte keine Verbindung hergestellt werden. Bitte überprüfen Sie die Adresse und versuchen es erneut.';
	}
	else {
		//Default language
	}

	Language['scmp_create_enter_port'] = 'Port';
};