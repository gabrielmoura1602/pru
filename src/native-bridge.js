// Ponte entre o Prumo (index.html) e o Android.
// Este arquivo (native-bridge.js) é empacotado pelo esbuild em www/native.js e expõe window.PrumoNative.
// No navegador comum (sem Capacitor) o objeto não existe e o app funciona normalmente.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

if (Capacitor.isNativePlatform()) {
  var CHANNEL = 'prumo-tarefas';
  var queue = Promise.resolve();

  // Serializa as operações para que dois agendamentos nunca se atropelem.
  var enqueue = function (fn) {
    queue = queue.then(fn, fn).catch(function () {});
    return queue;
  };

  window.PrumoNative = {
    isNative: true,

    init: function (h) {
      LocalNotifications.createChannel({
        id: CHANNEL,
        name: 'Tarefas e lembretes',
        description: 'Avisos das tarefas do Prumo',
        importance: 5,
        visibility: 1,
        vibration: true,
        lights: true,
      }).catch(function () {});

      LocalNotifications.addListener('localNotificationActionPerformed', function (ev) {
        var extra = (ev && ev.notification && ev.notification.extra) || {};
        if (h.onTap) h.onTap(extra);
      });
      App.addListener('resume', function () { if (h.onResume) h.onResume(); });
      App.addListener('backButton', function () { if (h.onBack) h.onBack(); });
    },

    // Estado das permissões: { notifications: granted|denied|prompt, exact: granted|denied|unknown }
    checkPerm: function () {
      return Promise.all([
        LocalNotifications.checkPermissions().catch(function () { return { display: 'prompt' }; }),
        LocalNotifications.checkExactNotificationSetting
          ? LocalNotifications.checkExactNotificationSetting().catch(function () { return { exact_alarm: 'unknown' }; })
          : Promise.resolve({ exact_alarm: 'granted' }),
      ]).then(function (r) {
        return { notifications: r[0].display, exact: r[1].exact_alarm || 'unknown' };
      });
    },

    requestPerm: function () {
      return LocalNotifications.requestPermissions()
        .then(function () { return window.PrumoNative.checkPerm(); })
        .catch(function () { return { notifications: 'denied', exact: 'unknown' }; });
    },

    openExactSettings: function () {
      if (LocalNotifications.changeExactNotificationSetting) {
        return LocalNotifications.changeExactNotificationSetting().catch(function () {});
      }
      return Promise.resolve();
    },

    // Troca TODOS os agendamentos pendentes pela lista recebida.
    // list: [{ at: ms, title, body, extra }]
    schedule: function (list) {
      return enqueue(async function () {
        var pending = await LocalNotifications.getPending();
        if (pending.notifications && pending.notifications.length) {
          await LocalNotifications.cancel({
            notifications: pending.notifications.map(function (n) { return { id: n.id }; }),
          });
        }
        if (!list || !list.length) return;
        var now = Date.now();
        var items = list
          .filter(function (n) { return n.at > now + 1000; })
          .map(function (n, i) {
            return {
              id: i + 1,
              title: n.title,
              body: n.body || '',
              channelId: CHANNEL,
              smallIcon: 'ic_stat_prumo',
              iconColor: '#2B4BD9',
              autoCancel: true,
              extra: n.extra || {},
              schedule: { at: new Date(n.at), allowWhileIdle: true },
            };
          });
        if (items.length) await LocalNotifications.schedule({ notifications: items });
      });
    },

    // Notificação de teste daqui a `sec` segundos (id alto para não colidir com as tarefas).
    test: function (sec) {
      return LocalNotifications.schedule({
        notifications: [{
          id: 999999,
          title: 'Prumo: teste de notificação',
          body: 'Se você está vendo isto, os avisos estão funcionando.',
          channelId: CHANNEL,
          smallIcon: 'ic_stat_prumo',
          iconColor: '#2B4BD9',
          schedule: { at: new Date(Date.now() + (sec || 5) * 1000), allowWhileIdle: true },
        }],
      });
    },

    // Cor e estilo da barra de status acompanham o tema do app.
    setBars: function (dark, color) {
      StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(function () {});
      if (color) StatusBar.setBackgroundColor({ color: color }).catch(function () {});
    },

    minimize: function () { App.minimizeApp().catch(function () {}); },
    exit: function () { App.exitApp(); },
  };
}
