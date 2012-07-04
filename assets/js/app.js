/* 
	Skycable Base Object
	LM: 07-03-12
*/
(function (window, document, z) {
	var $PAGES = z('section.page'), // used in Ui
		$root = z(document),
		TAP = 'tap',
		DBLTAP = 'doubleTap ',
		SKYCABLE_SCHEDULES = {},
		doneBuildingChannelList = false,
		SCHEDULE_FILE = '/mnt/sdcard/Raffy/skycable.json',
		pagePosition = {},
		SCHEDULES_DATA_URI = 'http://rafaelgandi.phpfogapp.com/scraper/?url=http://dl.dropbox.com/u/53834631/Skycable%20Scraper/skycable.json'; 
	
	var _CHANNELS = {
		'NATIONAL GEOGRAPHIC':41,
		'AXN':49,
		'BBC':29 ,
		'BIOGRAPHY':65,
		'CNN':28,
		'DISCOVERY CHANNEL':39,
		'DISNEY CHANNEL':47,
		'E!':57,
		'ESPN':31,
		'ETC':14,
		'FOX CHANNEL':50,
		'FOX CRIME':60,
		'FX':156,
		'AUSTRALIA NETWORK':130,
		'HBO':54,
		'HERO TV':44,
		'HISTORY CHANNEL':25,
		'JACK TV':51,
		'KIX':63,
		'LIFESTYLE NETWORK':52,
		'MAX':36,
		'MTV ASIA':71,
		'MYX':23,
		'SOLAR SPORTS':70,
		'STAR MOVIES':55,
		'STAR SPORTS':32,
		'STAR WORLD':48,
		'TLC':120,
		'VELVET':53,
		'ZOE TV':161,
		'UNIVERSAL CHANNEL':21
	};
	
	
	var Ui = {
		currentPage: null,
		gotoPage: function (_page, _data) {
			var $page = Util.getElementFromCache(_page);
			$page.data('sent', '');
			if (!!_data) {
				$page.data('sent', JSON.stringify({
					'data': _data
				}));	
			}				
			$PAGES.addClass('hide').removeClass('active_page');	
			$page.removeClass('hide').addClass('active_page');
			Ui.currentPage = $page;	
			$root.trigger(_page.replace(/#/ig, ''), [_data, $page]);
			$root.trigger('afterpagechange', [$page]);
		},
	
		init: function () {
			$root.on(DBLTAP, 'a.page_link', function (e) {
				e.preventDefault();				
				var data = this.getAttribute('data-send'),
					page = '#'+this.href.replace(/^.+#/, '');
				Ui.gotoPage(
					page, 
					(!!data)
						? JSON.parse(data)
						: false
				);
				
			});
			
			$root.on(TAP, 'button[data-href]', function (e) {
				e.preventDefault();
				var page = this.getAttribute('data-href'),
					data =  this.getAttribute('data-send');
				Ui.gotoPage(
					page, 
					(!!data)
						? JSON.parse(data)
						: false
				);							
			});
			
			var hLight = function (_e, _cssClass) {
				var etype = _e.type.toLowerCase(),
					$me = z(_e.Element);
				if (etype === 'touchstart') {
					$me.addClass(_cssClass);
				}
				else if (etype === 'touchmove' || etype === 'touchend') {
					$me.removeClass(_cssClass);
				}			
			};
			
			$root.on('touchstart touchmove touchend', 'a', function (e) {
				hLight(z.extend(e, {'Element': this}), 'hlight');
			});
			
			$root.on('touchstart touchmove touchend', 'button', function (e) {			
				hLight(z.extend(e, {'Element': this}), 'button_depress');
			});
		}
	};
	
	
	var Util = {
		
		setStoredSkedValue: function (_res) {
			var r, err = false;					
			try { r = JSON.parse(_res); }
			catch (e) { 
				try {
					eval('r='+_res+';');
				}
				catch(lastResort){
					alert('INVALID JSON FOUND ['+lastResort.toString()+']');
					return false;
				}						
			}
			SKYCABLE_SCHEDULES = Util.removeEmptyObjects(r);
			return true;
		},
		
		parseSchedule: function (_callback, _refreshSked) {	
			var refresh = _refreshSked || false;			
			if (refresh || !localStorage.getItem('skycable')) {
				if (navigator.network.connection.type === Connection.NONE) { // check for internet connection first
					alert('Oops, no internet connection.');
					_callback(true);
					return;
				}			
				Ui.gotoPage('#loading_page');
				z.ajax({
					url: SCHEDULES_DATA_URI,
					type: 'get',
					dataType: 'text',
					error: function (xhr, status, error) {
						alert('Sorry and error occurred while doing an ajax call to the skycable website scraper.');
						_callback(true);		
					},
					success: function (res) {						
						if (Util.setStoredSkedValue(res)) {
							localStorage.removeItem('skycable');
							localStorage.setItem('skycable', res);
							_callback(false);
						}
						else {	_callback(true); }	
					}
				});				
			}
			else {				
				_callback(!Util.setStoredSkedValue(localStorage.getItem('skycable')));
			}		
		},
		
		// See: http://stackoverflow.com/a/2673229
		isEmptyObject: function (obj) {
		  for (var prop in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, prop)) {
			  return false;
			}
		  }
		  return true;
		},
		
		today : (function () {
			var today = new Date(),
				d = (today.getDate() < 10) ? ('0'+today.getDate()) : today.getDate(),
				m = (today.getMonth()+1);
			m = (m < 10) ? ('0'+m) : m;				
			return {
				dateBare: today.getDate(),
				date: d,
				month: m,
				year: today.getFullYear(),
				timestamp: Math.floor(today.getTime() / 1000),
				dateFormatted: (m+'/'+d+'/'+today.getFullYear()) // format: MM/DD/YYYY
			};
		})(),
		
		getDayName: (function () {
			var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
				cache = {};
			return function (_date) {
				if (!(_date in cache)) {
					cache[_date] = days[(new Date(_date)).getDay()];
				}
				return cache[_date];
			};
		})(),
		
		removeEmptyObjects: function (_objs) {
			for (var p in _objs) {
				if (_objs.hasOwnProperty(p)) {
					if (Util.isEmptyObject(_objs[p])) {
						delete _objs[p];
					}
				}
			}
			return _objs;
		},
		
		getElementFromCache: (function () {
			var elems = {};
			return function (_selector, _useKey) {
				var selector = (typeof _useKey !== 'undefined') ? _useKey : _selector;		
				if (!elems[_selector]) {
					elems[_selector] = (typeof selector.selector !== 'undefined') ? selector : z(selector);
				}
				return elems[_selector];
			};			
		})()
	};
	
	window.Skycable = {		
		root: $root,			
		populateChannelList: function () {
			if (doneBuildingChannelList) {return;}
			doneBuildingChannelList = true;
			var html = '',
				$channelList = Util.getElementFromCache('#channel_list');
			for (var p in _CHANNELS) {
				html += '<li><a href="#date_list_page" data-send=\'{"channel":"'+_CHANNELS[p]+'","name":"'+p+'"}\' class="page_link channel_link">'+p+'</a></li>';
			}
			if ($channelList.length) {
				$channelList.html(html);
			}
			Util.getElementFromCache('#channel_list_page').removeClass('hide');			
		},
		
		populateDateListForChannel: function (_channelName) {			
			if (Util.isEmptyObject(SKYCABLE_SCHEDULES)) { // This part should unlikely to happen because of Skycable.init() checking
				alert('Oops, there are no stored schedules');
				Ui.gotoPage('#channel_list_page');
				return;
			}
			var html = '';				
			for (var p in SKYCABLE_SCHEDULES) {
				if (Util.today.dateFormatted == p) {
					html += '<li class="today"><a href="#sched_list_page" data-send=\'{"channelName":"'+_channelName+'","date":"'+p+'"}\' class="page_link channel_link">'+p+'<small>'+Util.getDayName(p)+'</small></a><img src="assets/images/today.png"></li>';
				}
				else {
					html += '<li><a href="#sched_list_page" data-send=\'{"channelName":"'+_channelName+'","date":"'+p+'"}\' class="page_link channel_link">'+p+'<small>'+Util.getDayName(p)+'</small></a></li>';
				}
				
			}
			Util.getElementFromCache('#date_list').html(html).removeClass('hide');	
		},
		
		populateSchedListForChannel: function (_channelName, _date) {
			var html = '',
				schedTemplate = Util.getElementFromCache('#sched_tpl').html(),
				$schedList = Util.getElementFromCache('#sched_list');
			if (!SKYCABLE_SCHEDULES[_date][_channelName]) {
				$schedList.html('');
				navigator.notification.alert(
					'Aw snap, no schedules available for this date',
					function () {},
					'Oop, no sched :(',
					'Ayt'
				);
				Util.getElementFromCache('#sched_list_page').find('button.sched_list_back_button').trigger(TAP);
				return;
			}	
			
			for (var p in SKYCABLE_SCHEDULES[_date]) {
				if (p.toUpperCase() === _channelName.toUpperCase()) {				
					var scheds = SKYCABLE_SCHEDULES[_date][p],
						len = scheds.length;
					for (var i=0; i<len; i++) {
						html += schedTemplate
									.replace('{time}', scheds[i].time)
									.replace('{title}', scheds[i].title)
									.replace('{desc}', scheds[i].desc);
					}
					break;
				}
			}
			$schedList.html(html).removeClass('hide');	
		},
		
		exitApp: function () {
			try {
				navigator.app.exitApp();
			}
			catch(e) {
				alert('ERROR: navigator.app.exitApp() - '+e.toString());
				navigator.device.exitApp();
			}
		},
		
		initEvents: function () {
			
			// Set the scroll offset position to 0 default value
			$PAGES.each(function () { pagePosition[this.id] = 0; });
		
			////////  PAGE EVENTS /////////			
			$root.on('afterpagechange', function (e, _$page) {
				var scrollOffset = pagePosition[_$page[0].id];
				if (typeof scrollOffset !== 'undefined') {
					window.scrollTo(0, scrollOffset);
				}				
			});			
			$root.on('channel_list_page', function () {
				Skycable.populateChannelList();
			});
			$root.on('date_list_page', function (e, _data) {
				Util.getElementFromCache('#date_list_page h1').text(_data.name);	
				Skycable.populateDateListForChannel(_data.name);			
				// Set the "data-send" attr of the sched list back button for
				// it to know which channel to go back to. (A sort of breadcrumb)	
				Util.getElementFromCache('button.sched_list_back_button').attr('data-send', JSON.stringify({
					'channel': _data.channel,
					'name': _data.name
				}));
			});		
			$root.on('sched_list_page', function (e, _data) {
				Util.getElementFromCache('#sched_list_page h1').html(_data.channelName+'<br> <small>('+_data.date+')</small>');
				Skycable.populateSchedListForChannel(_data.channelName, _data.date);						
			});
			
			// Remember the previous positions of each page //
			$root.on('touchstart', 'ul.listview a', function (e) {
				pagePosition[Ui.currentPage[0].id] = window.scrollY;
			});
			
			// Exit Button //
			z('button.exit, a.exit').on(TAP, function (e) {
				e.preventDefault();
				Skycable.exitApp();
			});
			
			z('#menu_cannellist_link').on(TAP, function (e) {
				// Delay for the scrollTo function to work //
				setTimeout(function () {
					window.scrollTo(0,0);
				}, 0);
				Ui.gotoPage('#channel_list_page');
			});
			
			// Back buttons //
			var goBackHandler = function () {
				var $backButton = (!!Ui.currentPage)
									? Util.getElementFromCache('#'+Ui.currentPage[0].id+' button.back')
									: z('section.active_page').find('button.back');					
				if ($backButton.length) {
					$backButton.trigger(TAP);
				}
			};
			document.addEventListener('backbutton', goBackHandler, false);
			$root.on('swipeRight', goBackHandler);
			
			// Menu button //
			document.addEventListener('menubutton', function () {
				if (Util.getElementFromCache('#menu_con').hasClass('menu_up')) {
					Util.getElementFromCache('#menu_con').removeClass('menu_up');
					return;
				}
				Util.getElementFromCache('#menu_con').addClass('menu_up');
				Util.getElementFromCache('#menu_con a').removeClass('hlight');
			}, false);
			
			// On Menu Blur //
			$root.on('touchstart', (function () {
				var timer;
				return function () {
					clearTimeout(timer);
					timer = setTimeout(function () {
						Util.getElementFromCache('#menu_con').removeClass('menu_up');
					}, 300);					
				};
			})());
			
			z('#sked_refresh').on(TAP, function (e) {
				e.preventDefault();
				if (navigator.network.connection.type === Connection.NONE) { // if no internet connection
					alert('Can\'t get new schedules cause their is no internet access');
					return;
				}
				var _doRefreshing = function () {
					Ui.gotoPage('#loading_page');
					Util.parseSchedule(function (_err) {
						if (_err) {			
							alert('An error occured when getting schedules. Unable to refresh schedules');
						}
						Ui.gotoPage('#channel_list_page');						
					}, true);		
				};
				
				if (typeof navigator.notification.confirm !== 'undefined') {
					navigator.notification.confirm(
						'Do you really want to refresh the schedules?',
						function (button) {
							if (button === 1) {
								_doRefreshing();
							}
						},
						'Refresh Schedules',
						'Yep,Nope'
					);
				}
				else { // old fashioned
					if (confirm('Do you really want to refresh the schedules?')) {	
						_doRefreshing();		
					}
				}					
			});
			
			$root.on('focus', 'a, button', function () {
				z(this).blur();
			});
		},
		
		init: function () {
			Ui.init();			
			Util.parseSchedule(function (_err) {
				if (!_err) {
					// Run the required events //
					Skycable.initEvents(); 					
					Ui.gotoPage('#channel_list_page');
				}
				else {
					alert('Oh no! I can\'t seem to get the schedules. Sorry.');
					Skycable.exitApp();
				}	
			});						
		}	
	};
	
})(window, document, Zepto);