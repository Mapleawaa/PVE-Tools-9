// v5.1.2-t1763394412
Ext.ns('Proxmox');
Ext.ns('Proxmox.Setup');

if (!Ext.isDefined(Proxmox.Setup.auth_cookie_name)) {
    throw 'Proxmox library not initialized';
}

// avoid errors when running without development tools
if (!Ext.isDefined(Ext.global.console)) {
    let console = {
        dir: function () {
            // do nothing
        },
        log: function () {
            // do nothing
        },
        warn: function () {
            // do nothing
        },
    };
    Ext.global.console = console;
}

Ext.Ajax.defaultHeaders = {
    Accept: 'application/json',
};

Ext.Ajax.on('beforerequest', function (conn, options) {
    if (Proxmox.CSRFPreventionToken) {
        if (!options.headers) {
            options.headers = {};
        }
        options.headers.CSRFPreventionToken = Proxmox.CSRFPreventionToken;
    }
    let storedAuth = Proxmox.Utils.getStoredAuth();
    if (storedAuth.token) {
        options.headers.Authorization = storedAuth.token;
    }
});

Ext.define('Proxmox.Utils', {
    // a singleton
    utilities: {
        yesText: gettext('Yes'),
        noText: gettext('No'),
        enabledText: gettext('Enabled'),
        disabledText: gettext('Disabled'),
        noneText: gettext('none'),
        NoneText: gettext('None'),
        errorText: gettext('Error'),
        warningsText: ngettext('Warning', 'Warnings', 1), // TODO: make use of count
        unknownText: gettext('Unknown'),
        defaultText: gettext('Default'),
        daysText: gettext('days'),
        dayText: gettext('day'),
        runningText: gettext('running'),
        stoppedText: gettext('stopped'),
        neverText: gettext('never'),
        totalText: gettext('Total'),
        usedText: gettext('Used'),
        directoryText: gettext('Directory'),
        stateText: gettext('State'),

        language_map: {
            //language map is sorted alphabetically by iso 639-1
            ar: `العربية - ${gettext('Arabic')}`,
            bg: `Български - ${gettext('Bulgarian')}`,
            ca: `Català - ${gettext('Catalan')}`,
            cs: `Czech - ${gettext('Czech')}`,
            da: `Dansk - ${gettext('Danish')}`,
            de: `Deutsch - ${gettext('German')}`,
            en: `English - ${gettext('English')}`,
            es: `Español - ${gettext('Spanish')}`,
            eu: `Euskera (Basque) - ${gettext('Euskera (Basque)')}`,
            fa: `فارسی - ${gettext('Persian (Farsi)')}`,
            fr: `Français - ${gettext('French')}`,
            hr: `Hrvatski - ${gettext('Croatian')}`,
            he: `עברית - ${gettext('Hebrew')}`,
            it: `Italiano - ${gettext('Italian')}`,
            ja: `日本語 - ${gettext('Japanese')}`,
            ka: `ქართული - ${gettext('Georgian')}`,
            ko: `한국어 - ${gettext('Korean')}`,
            nb: `Bokmål - ${gettext('Norwegian (Bokmal)')}`,
            nl: `Nederlands - ${gettext('Dutch')}`,
            nn: `Nynorsk - ${gettext('Norwegian (Nynorsk)')}`,
            pl: `Polski - ${gettext('Polish')}`,
            pt_BR: `Português Brasileiro - ${gettext('Portuguese (Brazil)')}`,
            ru: `Русский - ${gettext('Russian')}`,
            sl: `Slovenščina - ${gettext('Slovenian')}`,
            sv: `Svenska - ${gettext('Swedish')}`,
            tr: `Türkçe - ${gettext('Turkish')}`,
            ukr: `Українська - ${gettext('Ukrainian')}`,
            zh_CN: `中文（简体）- ${gettext('Chinese (Simplified)')}`,
            zh_TW: `中文（繁體）- ${gettext('Chinese (Traditional)')}`,
        },

        render_language: function (value) {
            if (!value || value === '__default__') {
                return Proxmox.Utils.defaultText + ' (English)';
            }
            if (value === 'kr') {
                value = 'ko'; // fix-up wrongly used Korean code. FIXME: remove with trixie releases
            }
            let text = Proxmox.Utils.language_map[value];
            if (text) {
                return text + ' (' + value + ')';
            }
            return value;
        },

        renderEnabledIcon: (enabled) => `<i class="fa fa-${enabled ? 'check' : 'minus'}"></i>`,

        language_array: function () {
            let data = [['__default__', Proxmox.Utils.render_language('')]];
            Ext.Object.each(Proxmox.Utils.language_map, function (key, value) {
                data.push([key, Proxmox.Utils.render_language(value)]);
            });

            return data;
        },

        theme_map: {
            crisp: 'Light theme',
            'proxmox-dark': 'Proxmox Dark',
        },

        render_theme: function (value) {
            if (!value || value === '__default__') {
                return Proxmox.Utils.defaultText + ' (auto)';
            }
            let text = Proxmox.Utils.theme_map[value];
            if (text) {
                return text;
            }
            return value;
        },

        theme_array: function () {
            let data = [['__default__', Proxmox.Utils.render_theme('')]];
            Ext.Object.each(Proxmox.Utils.theme_map, function (key, value) {
                data.push([key, Proxmox.Utils.render_theme(value)]);
            });

            return data;
        },

        bond_mode_gettext_map: {
            '802.3ad': 'LACP (802.3ad)',
            'lacp-balance-slb': 'LACP (balance-slb)',
            'lacp-balance-tcp': 'LACP (balance-tcp)',
        },

        render_bond_mode: (value) => Proxmox.Utils.bond_mode_gettext_map[value] || value || '',

        bond_mode_array: function (modes) {
            return modes.map((mode) => [mode, Proxmox.Utils.render_bond_mode(mode)]);
        },

        getNoSubKeyHtml: function (url) {
            let html_url = Ext.String.format(
                '<a target="_blank" href="{0}">www.proxmox.com</a>',
                url || 'https://www.proxmox.com',
            );
            return Ext.String.format(
                gettext(
                    'You do not have a valid subscription for this server. Please visit {0} to get a list of available options.',
                ),
                html_url,
            );
        },

        format_boolean_with_default: function (value) {
            if (Ext.isDefined(value) && value !== '__default__') {
                return value ? Proxmox.Utils.yesText : Proxmox.Utils.noText;
            }
            return Proxmox.Utils.defaultText;
        },

        format_boolean: function (value) {
            return value ? Proxmox.Utils.yesText : Proxmox.Utils.noText;
        },

        format_neg_boolean: function (value) {
            return !value ? Proxmox.Utils.yesText : Proxmox.Utils.noText;
        },

        format_enabled_toggle: function (value) {
            return value ? Proxmox.Utils.enabledText : Proxmox.Utils.disabledText;
        },

        format_expire: function (date) {
            if (!date) {
                return Proxmox.Utils.neverText;
            }
            return Ext.Date.format(date, 'Y-m-d');
        },

        // somewhat like a human would tell durations, omit zero values and do not
        // give seconds precision if we talk days already
        format_duration_human: function (ut) {
            let seconds = 0,
                minutes = 0,
                hours = 0,
                days = 0,
                years = 0;

            if (ut <= 0.1) {
                return '<0.1s';
            }

            let remaining = ut;
            seconds = Number((remaining % 60).toFixed(1));
            remaining = Math.trunc(remaining / 60);
            if (remaining > 0) {
                minutes = remaining % 60;
                remaining = Math.trunc(remaining / 60);
                if (remaining > 0) {
                    hours = remaining % 24;
                    remaining = Math.trunc(remaining / 24);
                    if (remaining > 0) {
                        days = remaining % 365;
                        remaining = Math.trunc(remaining / 365); // yea, just lets ignore leap years...
                        if (remaining > 0) {
                            years = remaining;
                        }
                    }
                }
            }

            let res = [];
            let add = (t, unit) => {
                if (t > 0) {
                    res.push(t + unit);
                }
                return t > 0;
            };

            let addMinutes = !add(years, 'y');
            let addSeconds = !add(days, 'd');
            add(hours, 'h');
            if (addMinutes) {
                add(minutes, 'm');
                if (addSeconds) {
                    add(seconds, 's');
                }
            }
            return res.join(' ');
        },

        format_duration_long: function (ut) {
            let days = Math.floor(ut / 86400);
            ut -= days * 86400;
            let hours = Math.floor(ut / 3600);
            ut -= hours * 3600;
            let mins = Math.floor(ut / 60);
            ut -= mins * 60;

            let hours_str = '00' + hours.toString();
            hours_str = hours_str.substr(hours_str.length - 2);
            let mins_str = '00' + mins.toString();
            mins_str = mins_str.substr(mins_str.length - 2);
            let ut_str = '00' + ut.toString();
            ut_str = ut_str.substr(ut_str.length - 2);

            if (days) {
                let ds = days > 1 ? Proxmox.Utils.daysText : Proxmox.Utils.dayText;
                return days.toString() + ' ' + ds + ' ' + hours_str + ':' + mins_str + ':' + ut_str;
            } else {
                return hours_str + ':' + mins_str + ':' + ut_str;
            }
        },

        format_subscription_level: function (level) {
            if (level === 'c') {
                return 'Community';
            } else if (level === 'b') {
                return 'Basic';
            } else if (level === 's') {
                return 'Standard';
            } else if (level === 'p') {
                return 'Premium';
            } else {
                return Proxmox.Utils.noneText;
            }
        },

        compute_min_label_width: function (text, width) {
            if (width === undefined) {
                width = 100;
            }

            let tm = new Ext.util.TextMetrics();
            let min = tm.getWidth(text + ':');

            return min < width ? width : min;
        },

        // returns username + realm
        parse_userid: function (userid) {
            if (!Ext.isString(userid)) {
                return [undefined, undefined];
            }

            let match = userid.match(/^(.+)@([^@]+)$/);
            if (match !== null) {
                return [match[1], match[2]];
            }

            return [undefined, undefined];
        },

        render_username: function (userid) {
            let username = Proxmox.Utils.parse_userid(userid)[0] || '';
            return Ext.htmlEncode(username);
        },

        render_realm: function (userid) {
            let username = Proxmox.Utils.parse_userid(userid)[1] || '';
            return Ext.htmlEncode(username);
        },

        getStoredAuth: function () {
            let storedAuth = JSON.parse(window.localStorage.getItem('ProxmoxUser'));
            return storedAuth || {};
        },

        setAuthData: function (data) {
            Proxmox.UserName = data.username;
            Proxmox.LoggedOut = data.LoggedOut;
            // creates a session cookie (expire = null)
            // that way the cookie gets deleted after the browser window is closed
            if (data.ticket) {
                Proxmox.CSRFPreventionToken = data.CSRFPreventionToken;
                Ext.util.Cookies.set(
                    Proxmox.Setup.auth_cookie_name,
                    data.ticket,
                    null,
                    '/',
                    null,
                    true,
                    'lax',
                );
            }

            if (data.token) {
                window.localStorage.setItem('ProxmoxUser', JSON.stringify(data));
            }
        },

        authOK: function () {
            if (Proxmox.LoggedOut) {
                return undefined;
            }
            let storedAuth = Proxmox.Utils.getStoredAuth();
            let cookie = Ext.util.Cookies.get(Proxmox.Setup.auth_cookie_name);
            if (
                (Proxmox.UserName !== '' && cookie && !cookie.startsWith('PVE:tfa!')) ||
                storedAuth.token
            ) {
                return cookie || storedAuth.token;
            } else {
                return false;
            }
        },

        authClear: function () {
            if (Proxmox.LoggedOut) {
                return;
            }
            // ExtJS clear is basically the same, but browser may complain if any cookie isn't "secure"
            Ext.util.Cookies.set(
                Proxmox.Setup.auth_cookie_name,
                '',
                new Date(0),
                null,
                null,
                true,
                'lax',
            );
            window.localStorage.removeItem('ProxmoxUser');
        },

        // The End-User gets redirected back here after login on the OpenID auth. portal, and in the
        // redirection URL the state and auth.code are passed as URL GET params, this helper parses those
        getOpenIDRedirectionAuthorization: function () {
            const auth = Ext.Object.fromQueryString(window.location.search);
            if (auth.state !== undefined && auth.code !== undefined) {
                return auth;
            }
            return undefined;
        },

        // comp.setLoading() is buggy in ExtJS 4.0.7, so we
        // use el.mask() instead
        setErrorMask: function (comp, msg) {
            let el = comp.el;
            if (!el) {
                return;
            }
            if (!msg) {
                el.unmask();
            } else if (msg === true) {
                el.mask(gettext('Loading...'));
            } else {
                el.mask(msg);
            }
        },

        getResponseErrorMessage: (err) => {
            if (!err.statusText) {
                return gettext('Connection error');
            }
            let msg = [`${err.statusText} (${err.status})`];
            if (err.response && err.response.responseText) {
                let txt = err.response.responseText;
                try {
                    let res = JSON.parse(txt);
                    if (res.errors && typeof res.errors === 'object') {
                        for (let [key, value] of Object.entries(res.errors)) {
                            msg.push(Ext.String.htmlEncode(`${key}: ${value}`));
                        }
                    }
                } catch (_e) {
                    // fallback to string
                    msg.push(Ext.String.htmlEncode(txt));
                }
            }
            return msg.join('<br>');
        },

        monStoreErrors: function (component, store, clearMaskBeforeLoad, errorCallback) {
            if (clearMaskBeforeLoad) {
                component.mon(store, 'beforeload', function (s, operation, eOpts) {
                    Proxmox.Utils.setErrorMask(component, false);
                });
            } else {
                component.mon(store, 'beforeload', function (s, operation, eOpts) {
                    if (!component.loadCount) {
                        component.loadCount = 0; // make sure it is nucomponent.ic
                        Proxmox.Utils.setErrorMask(component, true);
                    }
                });
            }

            // only works with 'proxmox' proxy
            component.mon(store.proxy, 'afterload', function (proxy, request, success) {
                component.loadCount++;

                if (success) {
                    Proxmox.Utils.setErrorMask(component, false);
                    return;
                }

                let error = request._operation.getError();
                let msg = Proxmox.Utils.getResponseErrorMessage(error);
                if (!errorCallback || !errorCallback(error, msg)) {
                    Proxmox.Utils.setErrorMask(component, Ext.htmlEncode(msg));
                }
            });
        },

        extractRequestError: function (result, verbose) {
            let msg = gettext('Successful');

            if (!result.success) {
                msg = gettext('Unknown error');
                if (result.message) {
                    msg = Ext.htmlEncode(result.message);
                    if (result.status) {
                        msg += ` (${result.status})`;
                    }
                }
                if (verbose && Ext.isObject(result.errors)) {
                    msg += '<br>';
                    Ext.Object.each(result.errors, (prop, desc) => {
                        msg += `<br><b>${Ext.htmlEncode(prop)}</b>: ${Ext.htmlEncode(desc)}`;
                    });
                }
            }

            return msg;
        },

        // Ext.Ajax.request
        API2Request: function (reqOpts) {
            let newopts = Ext.apply(
                {
                    waitMsg: gettext('Please wait...'),
                },
                reqOpts,
            );

            // default to enable if user isn't handling the failure already explicitly
            let autoErrorAlert =
                reqOpts.autoErrorAlert ??
                (typeof reqOpts.failure !== 'function' && typeof reqOpts.callback !== 'function');

            if (!newopts.url.match(/^\/api2/)) {
                newopts.url = '/api2/extjs' + newopts.url;
            }
            delete newopts.callback;
            let unmask = (target) => {
                if (target.waitMsgTargetCount === undefined || --target.waitMsgTargetCount <= 0) {
                    target.setLoading(false);
                    delete target.waitMsgTargetCount;
                }
            };

            let createWrapper = function (successFn, callbackFn, failureFn) {
                Ext.apply(newopts, {
                    success: function (response, options) {
                        if (options.waitMsgTarget) {
                            if (Proxmox.Utils.toolkit === 'touch') {
                                options.waitMsgTarget.setMasked(false);
                            } else {
                                unmask(options.waitMsgTarget);
                            }
                        }
                        let result = Ext.decode(response.responseText);
                        response.result = result;
                        if (!result.success) {
                            response.htmlStatus = Proxmox.Utils.extractRequestError(result, true);
                            Ext.callback(callbackFn, options.scope, [options, false, response]);
                            Ext.callback(failureFn, options.scope, [response, options]);
                            if (autoErrorAlert) {
                                Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                            }
                            return;
                        }
                        Ext.callback(callbackFn, options.scope, [options, true, response]);
                        Ext.callback(successFn, options.scope, [response, options]);
                    },
                    failure: function (response, options) {
                        if (options.waitMsgTarget) {
                            if (Proxmox.Utils.toolkit === 'touch') {
                                options.waitMsgTarget.setMasked(false);
                            } else {
                                unmask(options.waitMsgTarget);
                            }
                        }
                        response.result = {};
                        try {
                            response.result = Ext.decode(response.responseText);
                        } catch (_e) {
                            // ignore
                        }
                        let msg = gettext('Connection error') + ' - server offline?';
                        if (response.aborted) {
                            msg = gettext('Connection error') + ' - aborted.';
                        } else if (response.timedout) {
                            msg = gettext('Connection error') + ' - Timeout.';
                        } else if (response.status && response.statusText) {
                            msg =
                                gettext('Connection error') +
                                ' ' +
                                response.status +
                                ': ' +
                                response.statusText;
                        }
                        response.htmlStatus = Ext.htmlEncode(msg);
                        Ext.callback(callbackFn, options.scope, [options, false, response]);
                        Ext.callback(failureFn, options.scope, [response, options]);
                    },
                });
            };

            createWrapper(reqOpts.success, reqOpts.callback, reqOpts.failure);

            let target = newopts.waitMsgTarget;
            if (target) {
                if (Proxmox.Utils.toolkit === 'touch') {
                    target.setMasked({ xtype: 'loadmask', message: newopts.waitMsg });
                } else if (target.rendered) {
                    target.waitMsgTargetCount = (target.waitMsgTargetCount ?? 0) + 1;
                    target.setLoading(newopts.waitMsg);
                } else {
                    target.waitMsgTargetCount = (target.waitMsgTargetCount ?? 0) + 1;
                    target.on(
                        'afterlayout',
                        function () {
                            if ((target.waitMsgTargetCount ?? 0) > 0) {
                                target.setLoading(newopts.waitMsg);
                            }
                        },
                        target,
                        { single: true },
                    );
                }
            }
            Ext.Ajax.request(newopts);
        },

        // can be useful for catching displaying errors from the API, e.g.:
        // Proxmox.Async.api2({
        //     ...
        // }).catch(Proxmox.Utils.alertResponseFailure);
        alertResponseFailure: (res) =>
            Ext.Msg.alert(gettext('Error'), res.htmlStatus || res.result.message),

        checked_command: function (orig_cmd) {
            Proxmox.Utils.API2Request({
                url: '/nodes/localhost/subscription',
                method: 'GET',
                failure: function (response, opts) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
                success: function (response, opts) {
                    let res = response.result;
                    if (
                        res === null ||
                        res === undefined ||
                        !res ||
                        res.data.status.toLowerCase() !== 'active'
                    ) {
                        Ext.Msg.show({
                            title: gettext('No valid subscription'),
                            icon: Ext.Msg.WARNING,
                            message: Proxmox.Utils.getNoSubKeyHtml(res.data.url),
                            buttons: Ext.Msg.OK,
                            callback: function (btn) {
                                if (btn !== 'ok') {
                                    return;
                                }
                                orig_cmd();
                            },
                        });
                    } else {
                        orig_cmd();
                    }
                },
            });
        },

        assemble_field_data: function (values, data) {
            if (!Ext.isObject(data)) {
                return;
            }
            Ext.Object.each(data, function (name, val) {
                if (Object.hasOwn(values, name)) {
                    let bucket = values[name];
                    if (!Ext.isArray(bucket)) {
                        bucket = values[name] = [bucket];
                    }
                    if (Ext.isArray(val)) {
                        values[name] = bucket.concat(val);
                    } else {
                        bucket.push(val);
                    }
                } else {
                    values[name] = val;
                }
            });
        },

        updateColumnWidth: function (container, thresholdWidth) {
            let mode = Ext.state.Manager.get('summarycolumns') || 'auto';
            let factor;
            if (mode !== 'auto') {
                factor = parseInt(mode, 10);
                if (Number.isNaN(factor)) {
                    factor = 1;
                }
            } else {
                thresholdWidth = (thresholdWidth || 1400) + 1;
                factor = Math.ceil(container.getSize().width / thresholdWidth);
            }

            if (container.oldFactor === factor) {
                return;
            }

            let items = container.query('>'); // direct children
            factor = Math.min(factor, items.length);
            container.oldFactor = factor;

            items.forEach((item) => {
                item.columnWidth = 1 / factor;
            });

            // we have to update the layout twice, since the first layout change
            // can trigger the scrollbar which reduces the amount of space left
            container.updateLayout();
            container.updateLayout();
        },

        // NOTE: depreacated, use updateColumnWidth
        updateColumns: (container) => Proxmox.Utils.updateColumnWidth(container),

        dialog_title: function (subject, create, isAdd) {
            if (create) {
                if (isAdd) {
                    return gettext('Add') + ': ' + subject;
                } else {
                    return gettext('Create') + ': ' + subject;
                }
            } else {
                return gettext('Edit') + ': ' + subject;
            }
        },

        network_iface_types: {
            eth: gettext('Network Device'),
            bridge: 'Linux Bridge',
            bond: 'Linux Bond',
            vlan: 'Linux VLAN',
            OVSBridge: 'OVS Bridge',
            OVSBond: 'OVS Bond',
            OVSPort: 'OVS Port',
            OVSIntPort: 'OVS IntPort',
        },

        render_network_iface_type: function (value) {
            return Proxmox.Utils.network_iface_types[value] || Proxmox.Utils.unknownText;
        },

        // Only add product-agnostic fields here!
        notificationFieldName: {
            type: gettext('Notification type'),
            hostname: gettext('Hostname'),
        },

        formatNotificationFieldName: (value) => Proxmox.Utils.notificationFieldName[value] || value,

        // to add or change existing for product specific ones
        overrideNotificationFieldName: function (extra) {
            for (const [key, value] of Object.entries(extra)) {
                Proxmox.Utils.notificationFieldName[key] = value;
            }
        },

        // Only add product-agnostic fields here!
        notificationFieldValue: {
            'system-mail': gettext('Forwarded mails to the local root user'),
        },

        formatNotificationFieldValue: (value) =>
            Proxmox.Utils.notificationFieldValue[value] || value,

        // to add or change existing for product specific ones
        overrideNotificationFieldValue: function (extra) {
            for (const [key, value] of Object.entries(extra)) {
                Proxmox.Utils.notificationFieldValue[key] = value;
            }
        },

        // NOTE: only add general, product agnostic, ones here! Else use override helper in product repos
        task_desc_table: {
            aptupdate: ['', gettext('Update package database')],
            diskinit: ['Disk', gettext('Initialize Disk with GPT')],
            spiceshell: ['', gettext('Shell') + ' (Spice)'],
            srvreload: ['SRV', gettext('Reload')],
            srvrestart: ['SRV', gettext('Restart')],
            srvstart: ['SRV', gettext('Start')],
            srvstop: ['SRV', gettext('Stop')],
            termproxy: ['', gettext('Console') + ' (xterm.js)'],
            vncshell: ['', gettext('Shell')],
        },

        // to add or change existing for product specific ones
        override_task_descriptions: function (extra) {
            for (const [key, value] of Object.entries(extra)) {
                Proxmox.Utils.task_desc_table[key] = value;
            }
        },

        format_task_description: function (type, id) {
            let farray = Proxmox.Utils.task_desc_table[type];
            let text;
            if (!farray) {
                text = type;
                if (id) {
                    text += ' ' + id;
                }
                return text;
            } else if (Ext.isFunction(farray)) {
                return farray(type, id);
            }
            let prefix = farray[0];
            text = farray[1];
            if (prefix && id !== undefined) {
                return prefix + ' ' + id + ' - ' + text;
            }
            return text;
        },

        format_size: function (size, useSI) {
            let unitsSI = [
                gettext('B'),
                gettext('KB'),
                gettext('MB'),
                gettext('GB'),
                gettext('TB'),
                gettext('PB'),
                gettext('EB'),
                gettext('ZB'),
                gettext('YB'),
            ];
            let unitsIEC = [
                gettext('B'),
                gettext('KiB'),
                gettext('MiB'),
                gettext('GiB'),
                gettext('TiB'),
                gettext('PiB'),
                gettext('EiB'),
                gettext('ZiB'),
                gettext('YiB'),
            ];
            let order = 0;
            let commaDigits = 2;
            const baseValue = useSI ? 1000 : 1024;
            while (size >= baseValue && order < unitsSI.length) {
                size = size / baseValue;
                order++;
            }

            let unit = useSI ? unitsSI[order] : unitsIEC[order];
            if (order === 0) {
                commaDigits = 0;
            }
            return `${size.toFixed(commaDigits)} ${unit}`;
        },

        SizeUnits: {
            B: 1,

            KiB: 1024,
            MiB: 1024 * 1024,
            GiB: 1024 * 1024 * 1024,
            TiB: 1024 * 1024 * 1024 * 1024,
            PiB: 1024 * 1024 * 1024 * 1024 * 1024,

            KB: 1000,
            MB: 1000 * 1000,
            GB: 1000 * 1000 * 1000,
            TB: 1000 * 1000 * 1000 * 1000,
            PB: 1000 * 1000 * 1000 * 1000 * 1000,
        },

        parse_size_unit: function (val) {
            //let m = val.match(/([.\d])+\s?([KMGTP]?)(i?)B?\s*$/i);
            let m = val.match(/(\d+(?:\.\d+)?)\s?([KMGTP]?)(i?)B?\s*$/i);
            let size = parseFloat(m[1]);
            let scale = m[2].toUpperCase();
            let binary = m[3].toLowerCase();

            let unit = `${scale}${binary}B`;
            let factor = Proxmox.Utils.SizeUnits[unit];

            return { size, factor, unit, binary }; // for convenience return all we got
        },

        size_unit_to_bytes: function (val) {
            let { size, factor } = Proxmox.Utils.parse_size_unit(val);
            return size * factor;
        },

        autoscale_size_unit: function (val) {
            let { size, factor, binary } = Proxmox.Utils.parse_size_unit(val);
            return Proxmox.Utils.format_size(size * factor, binary !== 'i');
        },

        size_unit_ratios: function (a, b) {
            a = typeof a !== 'undefined' ? a : 0;
            b = typeof b !== 'undefined' ? b : Infinity;
            let aBytes = typeof a === 'number' ? a : Proxmox.Utils.size_unit_to_bytes(a);
            let bBytes = typeof b === 'number' ? b : Proxmox.Utils.size_unit_to_bytes(b);
            return aBytes / (bBytes || Infinity); // avoid division by zero
        },

        render_upid: function (value, metaData, record) {
            let task = record.data;
            let type = task.type || task.worker_type;
            let id = task.id || task.worker_id;

            return Ext.htmlEncode(Proxmox.Utils.format_task_description(type, id));
        },

        render_uptime: function (value) {
            let uptime = value;

            if (uptime === undefined) {
                return '';
            }

            if (uptime <= 0) {
                return '-';
            }

            return Proxmox.Utils.format_duration_long(uptime);
        },

        systemd_unescape: function (string_value) {
            const charcode_0 = '0'.charCodeAt(0);
            const charcode_9 = '9'.charCodeAt(0);
            const charcode_A = 'A'.charCodeAt(0);
            const charcode_F = 'F'.charCodeAt(0);
            const charcode_a = 'a'.charCodeAt(0);
            const charcode_f = 'f'.charCodeAt(0);
            const charcode_x = 'x'.charCodeAt(0);
            const charcode_minus = '-'.charCodeAt(0);
            const charcode_slash = '/'.charCodeAt(0);
            const charcode_backslash = '\\'.charCodeAt(0);

            let parse_hex_digit = function (d) {
                if (d >= charcode_0 && d <= charcode_9) {
                    return d - charcode_0;
                }
                if (d >= charcode_A && d <= charcode_F) {
                    return d - charcode_A + 10;
                }
                if (d >= charcode_a && d <= charcode_f) {
                    return d - charcode_a + 10;
                }
                throw 'got invalid hex digit';
            };

            let value = new TextEncoder().encode(string_value);
            let result = new Uint8Array(value.length);

            let i = 0;
            let result_len = 0;

            while (i < value.length) {
                let c0 = value[i];
                if (c0 === charcode_minus) {
                    result.set([charcode_slash], result_len);
                    result_len += 1;
                    i += 1;
                    continue;
                }
                if (i + 4 < value.length) {
                    let c1 = value[i + 1];
                    if (c0 === charcode_backslash && c1 === charcode_x) {
                        let h1 = parse_hex_digit(value[i + 2]);
                        let h0 = parse_hex_digit(value[i + 3]);
                        let ord = h1 * 16 + h0;
                        result.set([ord], result_len);
                        result_len += 1;
                        i += 4;
                        continue;
                    }
                }
                result.set([c0], result_len);
                result_len += 1;
                i += 1;
            }

            return new TextDecoder().decode(result.slice(0, result.len));
        },

        parse_task_upid: function (upid) {
            let task = {};

            let res = upid.match(
                /^UPID:([^\s:]+):([0-9A-Fa-f]{8}):([0-9A-Fa-f]{8,9}):(([0-9A-Fa-f]{8,16}):)?([0-9A-Fa-f]{8}):([^:\s]+):([^:\s]*):([^:\s]+):$/,
            );
            if (!res) {
                throw "unable to parse upid '" + upid + "'";
            }
            task.node = res[1];
            task.pid = parseInt(res[2], 16);
            task.pstart = parseInt(res[3], 16);
            if (res[5] !== undefined) {
                task.task_id = parseInt(res[5], 16);
            }
            task.starttime = parseInt(res[6], 16);
            task.type = res[7];
            task.id = Proxmox.Utils.systemd_unescape(res[8]);
            task.user = res[9];

            task.desc = Proxmox.Utils.format_task_description(task.type, task.id);

            return task;
        },

        parse_task_status: function (status) {
            if (status === 'OK') {
                return 'ok';
            }

            if (status === 'unknown') {
                return 'unknown';
            }

            let match = status.match(/^WARNINGS: (.*)$/);
            if (match) {
                return 'warning';
            }

            return 'error';
        },

        format_task_status: function (status) {
            let parsed = Proxmox.Utils.parse_task_status(status);
            switch (parsed) {
                case 'unknown':
                    return Proxmox.Utils.unknownText;
                case 'error':
                    return Proxmox.Utils.errorText + ': ' + Ext.htmlEncode(status);
                case 'warning':
                    return status.replace('WARNINGS', Proxmox.Utils.warningsText);
                case 'ok': // fall-through
                default:
                    return status;
            }
        },

        render_duration: function (value) {
            if (value === undefined) {
                return '-';
            }
            return Proxmox.Utils.format_duration_human(value);
        },

        render_timestamp: function (value, metaData, record, rowIndex, colIndex, store) {
            let servertime = new Date(value * 1000);
            return Ext.Date.format(servertime, 'Y-m-d H:i:s');
        },

        render_zfs_health: function (value) {
            if (typeof value === 'undefined') {
                return '';
            }
            var iconCls = 'question-circle';
            switch (value) {
                case 'AVAIL':
                case 'ONLINE':
                    iconCls = 'check-circle good';
                    break;
                case 'REMOVED':
                case 'DEGRADED':
                    iconCls = 'exclamation-circle warning';
                    break;
                case 'UNAVAIL':
                case 'FAULTED':
                case 'OFFLINE':
                    iconCls = 'times-circle critical';
                    break;
                default: //unknown
            }

            return '<i class="fa fa-' + iconCls + '"></i> ' + value;
        },

        get_help_info: function (section) {
            let helpMap;
            if (typeof proxmoxOnlineHelpInfo !== 'undefined') {
                helpMap = proxmoxOnlineHelpInfo;
            } else if (typeof pveOnlineHelpInfo !== 'undefined') {
                // be backward compatible with older pve-doc-generators
                helpMap = pveOnlineHelpInfo;
            } else {
                throw 'no global OnlineHelpInfo map declared';
            }

            if (helpMap[section]) {
                return helpMap[section];
            }
            // try to normalize - and _ separators, to support asciidoc and sphinx
            // references at the same time.
            let section_minus_normalized = section.replace(/_/g, '-');
            if (helpMap[section_minus_normalized]) {
                return helpMap[section_minus_normalized];
            }
            let section_underscore_normalized = section.replace(/-/g, '_');
            return helpMap[section_underscore_normalized];
        },

        get_help_link: function (section) {
            let info = Proxmox.Utils.get_help_info(section);
            if (!info) {
                return undefined;
            }
            return window.location.origin + info.link;
        },

        openXtermJsViewer: function (vmtype, vmid, nodename, vmname, cmd) {
            let url = Ext.Object.toQueryString({
                console: vmtype, // kvm, lxc, upgrade or shell
                xtermjs: 1,
                vmid: vmid,
                vmname: vmname,
                node: nodename,
                cmd: cmd,
            });
            let nw = window.open(
                '?' + url,
                '_blank',
                'toolbar=no,location=no,status=no,menubar=no,resizable=yes,width=800,height=420',
            );
            if (nw) {
                nw.focus();
            }
        },

        render_optional_url: function (value) {
            if (value && value.match(/^https?:\/\//) !== null) {
                return '<a target="_blank" href="' + value + '">' + value + '</a>';
            }
            return value;
        },

        render_san: function (value) {
            var names = [];
            if (Ext.isArray(value)) {
                value.forEach(function (val) {
                    if (!Ext.isNumber(val)) {
                        names.push(val);
                    }
                });
                return names.join('<br>');
            }
            return value;
        },

        render_usage: (val) => (val * 100).toFixed(2) + '%',

        render_cpu_usage: function (val, max) {
            return Ext.String.format(
                `${gettext('{0}% of {1}')} ${gettext('CPU(s)')}`,
                (val * 100).toFixed(2),
                max,
            );
        },

        render_size_usage: function (val, max, useSI) {
            if (max === 0) {
                return gettext('N/A');
            }
            let fmt = (v) => Proxmox.Utils.format_size(v, useSI);
            let ratio = ((val * 100) / max).toFixed(2);
            return (
                ratio + '% (' + Ext.String.format(gettext('{0} of {1}'), fmt(val), fmt(max)) + ')'
            );
        },

        render_cpu: function (value, metaData, record, rowIndex, colIndex, store) {
            if (!(record.data.uptime && Ext.isNumeric(value))) {
                return '';
            }

            let maxcpu = record.data.maxcpu || 1;
            if (!Ext.isNumeric(maxcpu) || maxcpu < 1) {
                return '';
            }
            let cpuText = maxcpu > 1 ? 'CPUs' : 'CPU';
            let ratio = (value * 100).toFixed(1);
            return `${ratio}% of ${maxcpu.toString()} ${cpuText}`;
        },

        render_size: function (value, metaData, record, rowIndex, colIndex, store) {
            if (!Ext.isNumeric(value)) {
                return '';
            }
            return Proxmox.Utils.format_size(value);
        },

        render_cpu_model: function (cpu) {
            let socketText = cpu.sockets > 1 ? gettext('Sockets') : gettext('Socket');
            return `${cpu.cpus} x ${cpu.model} (${cpu.sockets.toString()} ${socketText})`;
        },

        /* this is different for nodes */
        render_node_cpu_usage: function (value, record) {
            return Proxmox.Utils.render_cpu_usage(value, record.cpus);
        },

        render_node_size_usage: function (record) {
            return Proxmox.Utils.render_size_usage(record.used, record.total);
        },

        loadTextFromFile: function (file, callback, maxBytes) {
            let maxSize = maxBytes || 8192;
            if (file.size > maxSize) {
                Ext.Msg.alert(gettext('Error'), gettext('Invalid file size: ') + file.size);
                return;
            }
            let reader = new FileReader();
            reader.onload = (evt) => callback(evt.target.result);
            reader.readAsText(file);
        },

        parsePropertyString: function (value, defaultKey) {
            var res = {},
                error;

            if (typeof value !== 'string' || value === '') {
                return res;
            }

            Ext.Array.each(value.split(','), function (p) {
                var kv = p.split('=', 2);
                if (Ext.isDefined(kv[1])) {
                    res[kv[0]] = kv[1];
                } else if (Ext.isDefined(defaultKey)) {
                    if (Ext.isDefined(res[defaultKey])) {
                        error = 'defaultKey may be only defined once in propertyString';
                        return false; // break
                    }
                    res[defaultKey] = kv[0];
                } else {
                    error =
                        'invalid propertyString, not a key=value pair and no defaultKey defined';
                    return false; // break
                }
                return true;
            });

            if (error !== undefined) {
                console.error(error);
                return undefined;
            }

            return res;
        },

        printPropertyString: function (data, defaultKey) {
            var stringparts = [],
                gotDefaultKeyVal = false,
                defaultKeyVal;

            Ext.Object.each(data, function (key, value) {
                if (defaultKey !== undefined && key === defaultKey) {
                    gotDefaultKeyVal = true;
                    defaultKeyVal = value;
                } else if (Ext.isArray(value)) {
                    stringparts.push(key + '=' + value.join(';'));
                } else if (value !== '') {
                    stringparts.push(key + '=' + value);
                }
            });

            stringparts = stringparts.sort();
            if (gotDefaultKeyVal) {
                stringparts.unshift(defaultKeyVal);
            }

            return stringparts.join(',');
        },

        acmedomain_count: 5,

        parseACMEPluginData: function (data) {
            let res = {};
            let extradata = [];
            data.split('\n').forEach((line) => {
                // capture everything after the first = as value
                let [key, value] = line.split('=');
                if (value !== undefined) {
                    res[key] = value;
                } else {
                    extradata.push(line);
                }
            });
            return [res, extradata];
        },

        delete_if_default: function (values, fieldname, default_val, create) {
            if (values[fieldname] === '' || values[fieldname] === default_val) {
                if (!create) {
                    if (values.delete) {
                        if (Ext.isArray(values.delete)) {
                            values.delete.push(fieldname);
                        } else {
                            values.delete += ',' + fieldname;
                        }
                    } else {
                        values.delete = fieldname;
                    }
                }

                delete values[fieldname];
            }
        },

        printACME: function (value) {
            if (Ext.isArray(value.domains)) {
                value.domains = value.domains.join(';');
            }
            return Proxmox.Utils.printPropertyString(value);
        },

        parseACME: function (value) {
            if (!value) {
                return {};
            }

            var res = {};
            var error;

            Ext.Array.each(value.split(','), function (p) {
                var kv = p.split('=', 2);
                if (Ext.isDefined(kv[1])) {
                    res[kv[0]] = kv[1];
                } else {
                    error = 'Failed to parse key-value pair: ' + p;
                    return false;
                }
                return true;
            });

            if (error !== undefined) {
                console.error(error);
                return undefined;
            }

            if (res.domains !== undefined) {
                res.domains = res.domains.split(/;/);
            }

            return res;
        },

        add_domain_to_acme: function (acme, domain) {
            if (acme.domains === undefined) {
                acme.domains = [domain];
            } else {
                acme.domains.push(domain);
                acme.domains = acme.domains.filter(
                    (value, index, self) => self.indexOf(value) === index,
                );
            }
            return acme;
        },

        remove_domain_from_acme: function (acme, domain) {
            if (acme.domains !== undefined) {
                acme.domains = acme.domains.filter(
                    (value, index, self) => self.indexOf(value) === index && value !== domain,
                );
            }
            return acme;
        },

        get_health_icon: function (state, circle) {
            if (circle === undefined) {
                circle = false;
            }

            if (state === undefined) {
                state = 'uknown';
            }

            var icon = 'faded fa-question';
            switch (state) {
                case 'good':
                    icon = 'good fa-check';
                    break;
                case 'upgrade':
                    icon = 'warning fa-upload';
                    break;
                case 'old':
                    icon = 'warning fa-refresh';
                    break;
                case 'warning':
                    icon = 'warning fa-exclamation';
                    break;
                case 'critical':
                    icon = 'critical fa-times';
                    break;
                default:
                    break;
            }

            if (circle) {
                icon += '-circle';
            }

            return icon;
        },

        formatNodeRepoStatus: function (status, product) {
            let fmt = (txt, cls) => `<i class="fa fa-fw fa-lg fa-${cls}"></i>${txt}`;

            let getUpdates = Ext.String.format(gettext('{0} updates'), product);
            let noRepo = Ext.String.format(gettext('No {0} repository enabled!'), product);

            if (status === 'ok') {
                return (
                    fmt(getUpdates, 'check-circle good') +
                    ' ' +
                    fmt(
                        gettext('Production-ready Enterprise repository enabled'),
                        'check-circle good',
                    )
                );
            } else if (status === 'no-sub') {
                return (
                    fmt(
                        gettext('Production-ready Enterprise repository enabled'),
                        'check-circle good',
                    ) +
                    ' ' +
                    fmt(
                        gettext('Enterprise repository needs valid subscription'),
                        'exclamation-circle warning',
                    )
                );
            } else if (status === 'non-production') {
                return (
                    fmt(getUpdates, 'check-circle good') +
                    ' ' +
                    fmt(
                        gettext('Non production-ready repository enabled!'),
                        'exclamation-circle warning',
                    )
                );
            } else if (status === 'no-repo') {
                return fmt(noRepo, 'exclamation-circle critical');
            }

            return Proxmox.Utils.unknownText;
        },

        render_u2f_error: function (error) {
            var ErrorNames = {
                1: gettext('Other Error'),
                2: gettext('Bad Request'),
                3: gettext('Configuration Unsupported'),
                4: gettext('Device Ineligible'),
                5: gettext('Timeout'),
            };
            return 'U2F Error: ' + ErrorNames[error] || Proxmox.Utils.unknownText;
        },

        // Convert an ArrayBuffer to a base64url encoded string.
        // A `null` value will be preserved for convenience.
        bytes_to_base64url: function (bytes) {
            if (bytes === null) {
                return null;
            }

            return btoa(
                Array.from(new Uint8Array(bytes))
                    .map((val) => String.fromCharCode(val))
                    .join(''),
            )
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/[=]/g, '');
        },

        // Convert an a base64url string to an ArrayBuffer.
        // A `null` value will be preserved for convenience.
        base64url_to_bytes: function (b64u) {
            if (b64u === null) {
                return null;
            }

            return new Uint8Array(
                atob(b64u.replace(/-/g, '+').replace(/_/g, '/'))
                    .split('')
                    .map((val) => val.charCodeAt(0)),
            );
        },

        // Convert utf-8 string to base64.
        // This also escapes unicode characters such as emojis.
        utf8ToBase64: function (string) {
            let bytes = new TextEncoder().encode(string);
            const escapedString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
            return btoa(escapedString);
        },

        // Converts a base64 string into a utf8 string.
        // Decodes escaped unicode characters correctly.
        base64ToUtf8: function (b64_string) {
            let string = atob(b64_string);
            let bytes = Uint8Array.from(string, (m) => m.codePointAt(0));
            return new TextDecoder().decode(bytes);
        },

        stringToRGB: function (string) {
            let hash = 0;
            if (!string) {
                return hash;
            }
            string += 'prox'; // give short strings more variance
            for (let i = 0; i < string.length; i++) {
                hash = string.charCodeAt(i) + ((hash << 5) - hash);
                hash = hash & hash; // to int
            }

            let alpha = 0.7; // make the color a bit brighter
            let bg = 255; // assume white background

            return [
                (hash & 255) * alpha + bg * (1 - alpha),
                ((hash >> 8) & 255) * alpha + bg * (1 - alpha),
                ((hash >> 16) & 255) * alpha + bg * (1 - alpha),
            ];
        },

        rgbToCss: function (rgb) {
            return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        },

        rgbToHex: function (rgb) {
            let r = Math.round(rgb[0]).toString(16);
            let g = Math.round(rgb[1]).toString(16);
            let b = Math.round(rgb[2]).toString(16);
            return `${r}${g}${b}`;
        },

        hexToRGB: function (hex) {
            if (!hex) {
                return undefined;
            }
            if (hex.length === 7) {
                hex = hex.slice(1);
            }
            let r = parseInt(hex.slice(0, 2), 16);
            let g = parseInt(hex.slice(2, 4), 16);
            let b = parseInt(hex.slice(4, 6), 16);
            return [r, g, b];
        },

        // optimized & simplified SAPC function
        // https://github.com/Myndex/SAPC-APCA
        getTextContrastClass: function (rgb) {
            const blkThrs = 0.022;
            const blkClmp = 1.414;

            // linearize & gamma correction
            let r = (rgb[0] / 255) ** 2.4;
            let g = (rgb[1] / 255) ** 2.4;
            let b = (rgb[2] / 255) ** 2.4;

            // relative luminance sRGB
            let bg = r * 0.2126729 + g * 0.7151522 + b * 0.072175;

            // black clamp
            bg = bg > blkThrs ? bg : bg + (blkThrs - bg) ** blkClmp;

            // SAPC with white text
            let contrastLight = bg ** 0.65 - 1;
            // SAPC with black text
            let contrastDark = bg ** 0.56 - 0.046134502;

            if (Math.abs(contrastLight) >= Math.abs(contrastDark)) {
                return 'light';
            } else {
                return 'dark';
            }
        },

        getTagElement: function (string, color_overrides) {
            let rgb = color_overrides?.[string] || Proxmox.Utils.stringToRGB(string);
            let style = `background-color: ${Proxmox.Utils.rgbToCss(rgb)};`;
            let cls;
            if (rgb.length > 3) {
                style += `color: ${Proxmox.Utils.rgbToCss([rgb[3], rgb[4], rgb[5]])}`;
                cls = 'proxmox-tag-dark';
            } else {
                let txtCls = Proxmox.Utils.getTextContrastClass(rgb);
                cls = `proxmox-tag-${txtCls}`;
            }
            return `<span class="${cls}" style="${style}">${string}</span>`;
        },

        // Setting filename here when downloading from a remote url sometimes fails in chromium browsers
        // because of a bug when using attribute download in conjunction with a self signed certificate.
        // For more info see https://bugs.chromium.org/p/chromium/issues/detail?id=993362
        downloadAsFile: function (source, fileName) {
            let hiddenElement = document.createElement('a');
            hiddenElement.href = source;
            hiddenElement.target = '_blank';
            if (fileName) {
                hiddenElement.download = fileName;
            }
            hiddenElement.click();
        },
    },

    singleton: true,
    constructor: function () {
        let me = this;
        Ext.apply(me, me.utilities);

        let IPV4_OCTET = '(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])';
        let IPV4_REGEXP = '(?:(?:' + IPV4_OCTET + '\\.){3}' + IPV4_OCTET + ')';
        let IPV6_H16 = '(?:[0-9a-fA-F]{1,4})';
        let IPV6_LS32 = '(?:(?:' + IPV6_H16 + ':' + IPV6_H16 + ')|' + IPV4_REGEXP + ')';
        let IPV4_CIDR_MASK = '([0-9]{1,2})';
        let IPV6_CIDR_MASK = '([0-9]{1,3})';

        me.IP4_match = new RegExp('^(?:' + IPV4_REGEXP + ')$');
        me.IP4_cidr_match = new RegExp('^(?:' + IPV4_REGEXP + ')/' + IPV4_CIDR_MASK + '$');

        let IPV6_REGEXP =
            '(?:' +
            '(?:(?:' +
            '(?:' +
            IPV6_H16 +
            ':){6})' +
            IPV6_LS32 +
            ')|' +
            '(?:(?:' +
            '::' +
            '(?:' +
            IPV6_H16 +
            ':){5})' +
            IPV6_LS32 +
            ')|' +
            '(?:(?:(?:' +
            IPV6_H16 +
            ')?::' +
            '(?:' +
            IPV6_H16 +
            ':){4})' +
            IPV6_LS32 +
            ')|' +
            '(?:(?:(?:(?:' +
            IPV6_H16 +
            ':){0,1}' +
            IPV6_H16 +
            ')?::' +
            '(?:' +
            IPV6_H16 +
            ':){3})' +
            IPV6_LS32 +
            ')|' +
            '(?:(?:(?:(?:' +
            IPV6_H16 +
            ':){0,2}' +
            IPV6_H16 +
            ')?::' +
            '(?:' +
            IPV6_H16 +
            ':){2})' +
            IPV6_LS32 +
            ')|' +
            '(?:(?:(?:(?:' +
            IPV6_H16 +
            ':){0,3}' +
            IPV6_H16 +
            ')?::' +
            '(?:' +
            IPV6_H16 +
            ':){1})' +
            IPV6_LS32 +
            ')|' +
            '(?:(?:(?:(?:' +
            IPV6_H16 +
            ':){0,4}' +
            IPV6_H16 +
            ')?::' +
            ')' +
            IPV6_LS32 +
            ')|' +
            '(?:(?:(?:(?:' +
            IPV6_H16 +
            ':){0,5}' +
            IPV6_H16 +
            ')?::' +
            ')' +
            IPV6_H16 +
            ')|' +
            '(?:(?:(?:(?:' +
            IPV6_H16 +
            ':){0,7}' +
            IPV6_H16 +
            ')?::' +
            ')' +
            ')' +
            ')';

        me.IP6_match = new RegExp('^(?:' + IPV6_REGEXP + ')$');
        me.IP6_cidr_match = new RegExp('^(?:' + IPV6_REGEXP + ')/' + IPV6_CIDR_MASK + '$');
        me.IP6_bracket_match = new RegExp('^\\[(' + IPV6_REGEXP + ')\\]');

        me.IP64_match = new RegExp('^(?:' + IPV6_REGEXP + '|' + IPV4_REGEXP + ')$');
        me.IP64_cidr_match = new RegExp(
            '^(?:' +
                IPV6_REGEXP +
                '/' +
                IPV6_CIDR_MASK +
                ')|(?:' +
                IPV4_REGEXP +
                '/' +
                IPV4_CIDR_MASK +
                ')$',
        );

        let DnsName_REGEXP =
            '(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\\-]*[a-zA-Z0-9])?)\\.)*(?:[A-Za-z0-9](?:[A-Za-z0-9\\-]*[A-Za-z0-9])?))';
        me.DnsName_match = new RegExp('^' + DnsName_REGEXP + '$');
        me.DnsName_or_Wildcard_match = new RegExp('^(?:\\*\\.)?' + DnsName_REGEXP + '$');

        me.CpuSet_match = /^[0-9]+(?:-[0-9]+)?(?:,[0-9]+(?:-[0-9]+)?)*$/;

        me.HostPort_match = new RegExp(
            '^(' + IPV4_REGEXP + '|' + DnsName_REGEXP + ')(?::(\\d+))?$',
        );
        me.HostPortBrackets_match = new RegExp(
            '^\\[(' + IPV6_REGEXP + '|' + IPV4_REGEXP + '|' + DnsName_REGEXP + ')\\](?::(\\d+))?$',
        );
        me.IP6_dotnotation_match = new RegExp('^(' + IPV6_REGEXP + ')(?:\\.(\\d+))?$');
        me.Vlan_match = /^vlan(\d+)/;
        me.VlanInterface_match = /(\w+)\.(\d+)/;

        // Taken from proxmox-schema and ported to JS
        let PORT_REGEX_STR =
            '(?:[0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])';
        let IPRE_BRACKET_STR = '(?:' + IPV4_REGEXP + '|\\[(?:' + IPV6_REGEXP + ')\\])';
        let DNS_NAME_STR = '(?:(?:' + DnsName_REGEXP + '\\.)*' + DnsName_REGEXP + ')';
        let HTTP_URL_REGEX =
            '^https?://(?:(?:(?:' +
            DNS_NAME_STR +
            '|' +
            IPRE_BRACKET_STR +
            ')(?::' +
            PORT_REGEX_STR +
            ')?)|' +
            IPV6_REGEXP +
            ')(?:/[^\x00-\x1F\x7F]*)?$';

        me.httpUrlRegex = new RegExp(HTTP_URL_REGEX);

        // Same as SAFE_ID_REGEX in proxmox-schema
        me.safeIdRegex = /^(?:[A-Za-z0-9_][A-Za-z0-9._\-\\]*)$/;
    },
});

Ext.define('Proxmox.Async', {
    singleton: true,

    // Returns a Promise resolving to the result of an `API2Request` or rejecting to the error
    // response on failure
    api2: function (reqOpts) {
        return new Promise((resolve, reject) => {
            delete reqOpts.callback; // not allowed in this api
            reqOpts.success = (response) => resolve(response);
            reqOpts.failure = (response) => reject(response);
            Proxmox.Utils.API2Request(reqOpts);
        });
    },

    // Delay for a number of milliseconds.
    sleep: function (millis) {
        return new Promise((resolve, _reject) => setTimeout(resolve, millis));
    },
});

Ext.override(Ext.data.Store, {
    // If the store's proxy is changed while it is waiting for an AJAX
    // response, `onProxyLoad` will still be called for the outdated response.
    // To avoid displaying inconsistent information, only process responses
    // belonging to the current proxy. However, do not apply this workaround
    // to the mobile UI, as Sencha Touch has an incompatible internal API.
    onProxyLoad: function (operation) {
        let me = this;
        if (Proxmox.Utils.toolkit === 'touch' || operation.getProxy() === me.getProxy()) {
            me.callParent(arguments);
        } else {
            console.log(`ignored outdated response: ${operation.getRequest().getUrl()}`);
        }
    },
});
Ext.define('Proxmox.Schema', {
    // a singleton
    singleton: true,

    authDomains: {
        pam: {
            name: 'Linux PAM',
            ipanel: 'pmxAuthSimplePanel',
            onlineHelp: 'user-realms-pam',
            add: false,
            edit: true,
            pwchange: true,
            sync: false,
            useTypeInUrl: false,
        },
        openid: {
            name: gettext('OpenID Connect Server'),
            ipanel: 'pmxAuthOpenIDPanel',
            add: true,
            edit: true,
            tfa: false,
            pwchange: false,
            sync: false,
            iconCls: 'pmx-itype-icon-openid-logo',
            useTypeInUrl: true,
        },
        ldap: {
            name: gettext('LDAP Server'),
            ipanel: 'pmxAuthLDAPPanel',
            syncipanel: 'pmxAuthLDAPSyncPanel',
            add: true,
            edit: true,
            tfa: true,
            pwchange: false,
            sync: true,
            useTypeInUrl: true,
        },
        ad: {
            name: gettext('Active Directory Server'),
            ipanel: 'pmxAuthADPanel',
            syncipanel: 'pmxAuthADSyncPanel',
            add: true,
            edit: true,
            tfa: true,
            pwchange: false,
            sync: true,
            useTypeInUrl: true,
        },
    },
    // to add or change existing for product specific ones
    overrideAuthDomains: function (extra) {
        for (const [key, value] of Object.entries(extra)) {
            Proxmox.Schema.authDomains[key] = value;
        }
    },

    notificationEndpointTypes: {
        sendmail: {
            name: 'Sendmail',
            ipanel: 'pmxSendmailEditPanel',
            iconCls: 'fa-envelope-o',
            defaultMailAuthor: 'Proxmox VE',
        },
        smtp: {
            name: 'SMTP',
            ipanel: 'pmxSmtpEditPanel',
            iconCls: 'fa-envelope-o',
            defaultMailAuthor: 'Proxmox VE',
        },
        gotify: {
            name: 'Gotify',
            ipanel: 'pmxGotifyEditPanel',
            iconCls: 'fa-bell-o',
        },
        webhook: {
            name: 'Webhook',
            ipanel: 'pmxWebhookEditPanel',
            iconCls: 'fa-bell-o',
        },
    },

    // to add or change existing for product specific ones
    overrideEndpointTypes: function (extra) {
        for (const [key, value] of Object.entries(extra)) {
            Proxmox.Schema.notificationEndpointTypes[key] = value;
        }
    },

    pxarFileTypes: {
        b: { icon: 'cube', label: gettext('Block Device') },
        c: { icon: 'tty', label: gettext('Character Device') },
        d: { icon: 'folder-o', label: gettext('Directory') },
        f: { icon: 'file-text-o', label: gettext('File') },
        h: { icon: 'file-o', label: gettext('Hardlink') },
        l: { icon: 'link', label: gettext('Softlink') },
        p: { icon: 'exchange', label: gettext('Pipe/Fifo') },
        s: { icon: 'plug', label: gettext('Socket') },
        v: { icon: 'cube', label: gettext('Virtual') },
    },
});
// ExtJS related things

// do not send '_dc' parameter
Ext.Ajax.disableCaching = false;

// custom Vtypes
Ext.apply(Ext.form.field.VTypes, {
    IPAddress: function (v) {
        return Proxmox.Utils.IP4_match.test(v);
    },
    IPAddressText: gettext('Example') + ': 192.168.1.1',
    IPAddressMask: /[\d.]/i,

    IPCIDRAddress: function (v) {
        let result = Proxmox.Utils.IP4_cidr_match.exec(v);
        // limits according to JSON Schema see
        // pve-common/src/PVE/JSONSchema.pm
        return result !== null && result[1] >= 8 && result[1] <= 32;
    },
    IPCIDRAddressText:
        gettext('Example') + ': 192.168.1.1/24<br>' + gettext('Valid CIDR Range') + ': 8-32',
    IPCIDRAddressMask: /[\d./]/i,

    IP6Address: function (v) {
        return Proxmox.Utils.IP6_match.test(v);
    },
    IP6AddressText: gettext('Example') + ': 2001:DB8::42',
    IP6AddressMask: /[A-Fa-f0-9:]/,

    IP6CIDRAddress: function (v) {
        let result = Proxmox.Utils.IP6_cidr_match.exec(v);
        // limits according to JSON Schema see
        // pve-common/src/PVE/JSONSchema.pm
        return result !== null && result[1] >= 8 && result[1] <= 128;
    },
    IP6CIDRAddressText:
        gettext('Example') + ': 2001:DB8::42/64<br>' + gettext('Valid CIDR Range') + ': 8-128',
    IP6CIDRAddressMask: /[A-Fa-f0-9:/]/,

    IP6PrefixLength: function (v) {
        return v >= 0 && v <= 128;
    },
    IP6PrefixLengthText: gettext('Example') + ': X, where 0 <= X <= 128',
    IP6PrefixLengthMask: /[0-9]/,

    IP64Address: function (v) {
        return Proxmox.Utils.IP64_match.test(v);
    },
    IP64AddressText: gettext('Example') + ': 192.168.1.1 2001:DB8::42',
    IP64AddressMask: /[A-Fa-f0-9.:]/,

    IP64CIDRAddress: function (v) {
        let result = Proxmox.Utils.IP64_cidr_match.exec(v);
        if (result === null) {
            return false;
        }
        if (result[1] !== undefined) {
            return result[1] >= 8 && result[1] <= 128;
        } else if (result[2] !== undefined) {
            return result[2] >= 8 && result[2] <= 32;
        } else {
            return false;
        }
    },
    IP64CIDRAddressText: gettext('Example') + ': 192.168.1.1/24 2001:DB8::42/64',
    IP64CIDRAddressMask: /[A-Fa-f0-9.:/]/,

    MacAddress: function (v) {
        return /^([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/.test(v);
    },
    MacAddressMask: /[a-fA-F0-9:]/,
    MacAddressText: gettext('Example') + ': 01:23:45:67:89:ab',

    MacPrefix: function (v) {
        return /^[a-f0-9][02468ace](?::[a-f0-9]{2}){0,2}:?$/i.test(v);
    },
    MacPrefixMask: /[a-fA-F0-9:]/,
    MacPrefixText:
        gettext('Example') + ': 02:8f - ' + gettext('only unicast addresses are allowed'),

    BridgeName: function (v) {
        return /^[a-zA-Z][a-zA-Z0-9_]{0,9}$/.test(v);
    },
    VlanName: function (v) {
        if (Proxmox.Utils.VlanInterface_match.test(v)) {
            return true;
        } else if (Proxmox.Utils.Vlan_match.test(v)) {
            return true;
        }
        return true;
    },
    BridgeNameText: gettext('Format') + ': alphanumeric string starting with a character',

    BondName: function (v) {
        return /^bond\d{1,4}$/.test(v);
    },
    BondNameText: gettext('Format') + ': bond<b>N</b>, where 0 <= <b>N</b> <= 9999',

    InterfaceName: function (v) {
        return /^[a-z][a-z0-9_]{1,20}$/.test(v);
    },
    InterfaceNameText:
        gettext('Allowed characters') +
        ": 'a-z', '0-9', '_'<br />" +
        gettext('Minimum characters') +
        ': 2<br />' +
        gettext('Maximum characters') +
        ': 21<br />' +
        gettext('Must start with') +
        ": 'a-z'",

    StorageId: function (v) {
        return /^[a-z][a-z0-9\-_.]*[a-z0-9]$/i.test(v);
    },
    StorageIdText:
        gettext('Allowed characters') +
        ":  'A-Z', 'a-z', '0-9', '-', '_', '.'<br />" +
        gettext('Minimum characters') +
        ': 2<br />' +
        gettext('Must start with') +
        ": 'A-Z', 'a-z'<br />" +
        gettext('Must end with') +
        ": 'A-Z', 'a-z', '0-9'<br />",

    ConfigId: function (v) {
        return /^[a-z][a-z0-9_-]+$/i.test(v);
    },
    ConfigIdText:
        gettext('Allowed characters') +
        ": 'A-Z', 'a-z', '0-9', '_'<br />" +
        gettext('Minimum characters') +
        ': 2<br />' +
        gettext('Must start with') +
        ': ' +
        gettext('letter'),

    HttpProxy: function (v) {
        return /^http:\/\/.*$/.test(v);
    },
    HttpProxyText: gettext('Example') + ': http://username:password&#64;host:port/',

    CpuSet: function (v) {
        return Proxmox.Utils.CpuSet_match.test(v);
    },
    CpuSetText: gettext('This is not a valid CpuSet'),

    DnsName: function (v) {
        return Proxmox.Utils.DnsName_match.test(v);
    },
    DnsNameText: gettext('This is not a valid hostname'),

    DnsNameOrWildcard: function (v) {
        return Proxmox.Utils.DnsName_or_Wildcard_match.test(v);
    },
    DnsNameOrWildcardText: gettext('This is not a valid hostname'),

    // email regex used by pve-common
    proxmoxMail: function (v) {
        return /^[\w+-~]+(\.[\w+-~]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/.test(v);
    },
    proxmoxMailText: gettext('Example') + ': user@example.com',

    DnsOrIp: function (v) {
        if (!Proxmox.Utils.DnsName_match.test(v) && !Proxmox.Utils.IP64_match.test(v)) {
            return false;
        }

        return true;
    },
    DnsOrIpText: gettext('Not a valid DNS name or IP address.'),

    HostPort: function (v) {
        return (
            Proxmox.Utils.HostPort_match.test(v) ||
            Proxmox.Utils.HostPortBrackets_match.test(v) ||
            Proxmox.Utils.IP6_dotnotation_match.test(v)
        );
    },
    HostPortText: gettext('Host/IP address or optional port is invalid'),

    HostList: function (v) {
        let list = v.split(/[ ,;]+/);
        let i;
        for (i = 0; i < list.length; i++) {
            if (list[i] === '') {
                continue;
            }

            if (
                !Proxmox.Utils.HostPort_match.test(list[i]) &&
                !Proxmox.Utils.HostPortBrackets_match.test(list[i]) &&
                !Proxmox.Utils.IP6_dotnotation_match.test(list[i])
            ) {
                return false;
            }
        }

        return true;
    },
    HostListText: gettext('Not a valid list of hosts'),

    password: function (val, field) {
        if (field.initialPassField) {
            let pwd = field.up('form').down(`[name=${field.initialPassField}]`);
            return val === pwd.getValue();
        }
        return true;
    },

    passwordText: gettext('Passwords do not match'),

    email: function (value) {
        let emailre = /^[\w+~-]+(\.[\w+~-]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/;
        return emailre.test(value);
    },
});

// we always want the number in x.y format and never in, e.g., x,y
Ext.define('PVE.form.field.Number', {
    override: 'Ext.form.field.Number',
    submitLocaleSeparator: false,
});

// avois spamming the console and if we ever use this avoid a CORS block error too
Ext.define('PVE.draw.Container', {
    override: 'Ext.draw.Container',
    defaultDownloadServerUrl: document.location.origin, // avoid that pointing to http://svg.sencha.io
    applyDownloadServerUrl: function (url) {
        // avoid noisy warning, we don't really use that anyway
        url = url || this.defaultDownloadServerUrl;
        return url;
    },
});

// ExtJs 5-6 has an issue with caching
// see https://www.sencha.com/forum/showthread.php?308989
Ext.define('Proxmox.UnderlayPool', {
    override: 'Ext.dom.UnderlayPool',

    checkOut: function () {
        let cache = this.cache,
            len = cache.length,
            el;

        // do cleanup because some of the objects might have been destroyed
        while (len--) {
            if (cache[len].destroyed) {
                cache.splice(len, 1);
            }
        }
        // end do cleanup

        el = cache.shift();

        if (!el) {
            el = Ext.Element.create(this.elementConfig);
            el.setVisibilityMode(2);
            //<debug>
            // tell the spec runner to ignore this element when checking if the dom is clean
            el.dom.setAttribute('data-sticky', true);
            //</debug>
        }

        return el;
    },
});

// if the order of the values are not the same in originalValue and value
// extjs will not overwrite value, but marks the field dirty and thus
// the reset button will be enabled (but clicking it changes nothing)
// so if the arrays are not the same after resetting, we
// clear and set it
Ext.define('Proxmox.form.ComboBox', {
    override: 'Ext.form.field.ComboBox',

    reset: function () {
        // copied from combobox
        let me = this;
        me.callParent();

        // clear and set when not the same
        let value = me.getValue();
        if (
            Ext.isArray(me.originalValue) &&
            Ext.isArray(value) &&
            !Ext.Array.equals(value, me.originalValue)
        ) {
            me.clearValue();
            me.setValue(me.originalValue);
        }
    },

    // we also want to open the trigger on editable comboboxes by default
    initComponent: function () {
        let me = this;
        me.callParent();

        if (me.editable) {
            // The trigger.picker causes first a focus event on the field then
            // toggles the selection picker. Thus skip expanding in this case,
            // else our focus listener expands and the picker.trigger then
            // collapses it directly afterwards.
            Ext.override(me.triggers.picker, {
                onMouseDown: function (e) {
                    // copied "should we focus" check from Ext.form.trigger.Trigger
                    if (
                        e.pointerType !== 'touch' &&
                        !this.field.owns(Ext.Element.getActiveElement())
                    ) {
                        me.skip_expand_on_focus = true;
                    }
                    this.callParent(arguments);
                },
            });

            me.on('focus', function (combobox) {
                if (!combobox.isExpanded && !combobox.skip_expand_on_focus) {
                    combobox.expand();
                }
                combobox.skip_expand_on_focus = false;
            });
        }
    },
});

// when refreshing a grid/tree view, restoring the focus moves the view back to
// the previously focused item. Save scroll position before refocusing.
Ext.define(null, {
    override: 'Ext.view.Table',

    jumpToFocus: false,

    saveFocusState: function () {
        var me = this,
            store = me.dataSource,
            actionableMode = me.actionableMode,
            navModel = me.getNavigationModel(),
            focusPosition = actionableMode ? me.actionPosition : navModel.getPosition(true),
            activeElement = Ext.fly(Ext.Element.getActiveElement()),
            focusCell =
                focusPosition && focusPosition.view === me && Ext.fly(focusPosition.getCell(true)),
            refocusRow,
            refocusCol,
            record;

        // The navModel may return a position that is in a locked partner, so check that
        // the focusPosition's cell contains the focus before going forward.
        // The skipSaveFocusState is set by Actionables which actively control
        // focus destination. See CellEditing#activateCell.
        if (!me.skipSaveFocusState && focusCell && focusCell.contains(activeElement)) {
            // Separate this from the instance that the nav model is using.
            focusPosition = focusPosition.clone();

            // While we deactivate the focused element, suspend focus processing on it.
            activeElement.suspendFocusEvents();

            // Suspend actionable mode.
            // Each Actionable must silently save its state ready to resume when focus
            // can be restored but should only do that if the activeElement is not the cell itself,
            // this happens when the grid is refreshed while one of the actionables is being
            // deactivated (e.g. Calling  view refresh inside CellEditor 'edit' event listener).
            if (actionableMode && focusCell.dom !== activeElement.dom) {
                me.suspendActionableMode();
            } else {
                // Clear position, otherwise the setPosition on the other side
                // will be rejected as a no-op if the resumption position is logically
                // equivalent.
                actionableMode = false;
                navModel.setPosition();
            }

            // Do not leave the element in that state in case refresh fails, and restoration
            // closure not called.
            activeElement.resumeFocusEvents();

            // if the store is expanding or collapsing, we should never scroll the view.
            if (store.isExpandingOrCollapsing) {
                return Ext.emptyFn;
            }

            // The following function will attempt to refocus back in the same mode to the same cell
            // as it was at before based upon the previous record (if it's still in the store),
            // or the row index.
            return function () {
                var all;

                // May have changed due to reconfigure
                store = me.dataSource;

                // If we still have data, attempt to refocus in the same mode.
                if (store.getCount()) {
                    all = me.all;

                    // Adjust expectations of where we are able to refocus according to
                    // what kind of destruction might have been wrought on this view's DOM
                    // during focus save.
                    refocusRow = Math.min(
                        Math.max(focusPosition.rowIdx, all.startIndex),
                        all.endIndex,
                    );

                    refocusCol = Math.min(
                        focusPosition.colIdx,
                        me.getVisibleColumnManager().getColumns().length - 1,
                    );

                    record = focusPosition.record;

                    focusPosition = new Ext.grid.CellContext(me).setPosition(
                        record && store.contains(record) && !record.isCollapsedPlaceholder
                            ? record
                            : refocusRow,
                        refocusCol,
                    );

                    // Maybe there are no cells. eg: all groups collapsed.
                    if (focusPosition.getCell(true)) {
                        if (actionableMode) {
                            me.resumeActionableMode(focusPosition);
                        } else {
                            // we sometimes want to scroll back to where we are

                            let x = me.getScrollX();
                            let y = me.getScrollY();

                            // Pass "preventNavigation" as true
                            // so that that does not cause selection.
                            navModel.setPosition(focusPosition, null, null, null, true);

                            if (!navModel.getPosition()) {
                                focusPosition.column.focus();
                            }

                            if (!me.jumpToFocus) {
                                me.scrollTo(x, y);
                            }
                        }
                    }
                } else {
                    // No rows - focus associated column header
                    focusPosition.column.focus();
                }
            };
        }
        return Ext.emptyFn;
    },
});

// ExtJS 6.0.1 has no setSubmitValue() (although you find it in the docs).
// Note: this.submitValue is a boolean flag, whereas getSubmitValue() returns
// data to be submitted.
Ext.define('Proxmox.form.field.Text', {
    override: 'Ext.form.field.Text',

    setSubmitValue: function (v) {
        this.submitValue = v;
    },
});

// make mousescrolling work in firefox in the containers overflowhandler,
// by using only the 'wheel' event not 'mousewheel'(fixed in 7.3)
// also reverse the scrolldirection (fixed in 7.3)
// and reduce the default increment
Ext.define(null, {
    override: 'Ext.layout.container.boxOverflow.Scroller',

    wheelIncrement: 1,

    getWheelDelta: function (e) {
        return -e.getWheelDelta(e);
    },

    onOwnerRender: function (owner) {
        var me = this,
            scrollable = {
                isBoxOverflowScroller: true,
                x: false,
                y: false,
                listeners: {
                    scrollend: this.onScrollEnd,
                    scope: this,
                },
            };

        // If no obstrusive scrollbars, allow natural scrolling on mobile touch devices
        if (!Ext.scrollbar.width() && !Ext.platformTags.desktop) {
            scrollable[owner.layout.horizontal ? 'x' : 'y'] = true;
        } else {
            me.wheelListener = me.layout.innerCt.on('wheel', me.onMouseWheel, me, {
                destroyable: true,
            });
        }

        owner.setScrollable(scrollable);
    },
});

// extj 6.7 reversed mousewheel direction... (fixed in 7.3)
// https://forum.sencha.com/forum/showthread.php?472517-Mousewheel-scroll-direction-in-numberfield-with-spinners
// also use the 'wheel' event instead of 'mousewheel' (fixed in 7.3)
Ext.define('Proxmox.form.field.Spinner', {
    override: 'Ext.form.field.Spinner',

    onRender: function () {
        let me = this;

        me.callParent();

        // Init mouse wheel
        if (me.mouseWheelEnabled) {
            // Unlisten Ext generated listener ('mousewheel' is deprecated anyway)
            me.mun(me.bodyEl, 'mousewheel', me.onMouseWheel, me);

            me.mon(me.bodyEl, 'wheel', me.onMouseWheel, me);
        }
    },

    onMouseWheel: function (e) {
        var me = this,
            delta;
        if (me.hasFocus) {
            delta = e.getWheelDelta();
            if (delta > 0) {
                me.spinDown();
            } else if (delta < 0) {
                me.spinUp();
            }
            e.stopEvent();
            me.onSpinEnd();
        }
    },
});

// add '@' to the valid id
Ext.define('Proxmox.validIdReOverride', {
    override: 'Ext.Component',
    validIdRe: /^[a-z_][a-z0-9\-_@]*$/i,
});

Ext.define('Proxmox.selection.CheckboxModel', {
    override: 'Ext.selection.CheckboxModel',

    // [P] use whole checkbox cell to multiselect, not only the checkbox
    checkSelector: '.x-grid-cell-row-checker',

    // TODO: remove all optimizations below to an override for parent 'Ext.selection.Model' ??

    // [ P: optimized to remove all records at once as single remove is O(n^3) slow ]
    // records can be an index, a record or an array of records
    doDeselect: function (records, suppressEvent) {
        var me = this,
            selected = me.selected,
            i = 0,
            len,
            record,
            commit;
        if (me.locked || !me.store) {
            return false;
        }
        if (typeof records === 'number') {
            // No matching record, jump out
            record = me.store.getAt(records);
            if (!record) {
                return false;
            }
            records = [record];
        } else if (!Ext.isArray(records)) {
            records = [records];
        }
        // [P] a beforedeselection, triggered by me.onSelectChange below, can block removal by
        // returning false, thus the original implementation removed only here in the commit fn,
        // which has an abysmal performance O(n^3). As blocking removal is not the norm, go do the
        // reverse, record blocked records and remove them from the to-be-removed array before
        // applying it. A FF86 i9-9900K on 10k records goes from >40s to ~33ms for >90% deselection
        let committed = false;
        commit = function () {
            committed = true;
            if (record === me.selectionStart) {
                me.selectionStart = null;
            }
        };
        let removalBlocked = [];
        len = records.length;
        me.suspendChanges();
        for (; i < len; i++) {
            record = records[i];
            if (me.isSelected(record)) {
                committed = false;
                me.onSelectChange(record, false, suppressEvent, commit);
                if (!committed) {
                    removalBlocked.push(record);
                }
                if (me.destroyed) {
                    return false;
                }
            }
        }
        if (removalBlocked.length > 0) {
            records.remove(removalBlocked);
        }
        selected.remove(records); // [P] FAST(er)
        me.lastSelected = selected.last();
        me.resumeChanges();
        // fire selchange if there was a change and there is no suppressEvent flag
        me.maybeFireSelectionChange(records.length > 0 && !suppressEvent);
        return records.length;
    },

    doMultiSelect: function (records, keepExisting, suppressEvent) {
        var me = this,
            selected = me.selected,
            change = false,
            result,
            i,
            len,
            record,
            commit;

        if (me.locked) {
            return;
        }

        records = !Ext.isArray(records) ? [records] : records;
        len = records.length;
        if (!keepExisting && selected.getCount() > 0) {
            result = me.deselectDuringSelect(records, suppressEvent);
            if (me.destroyed) {
                return;
            }
            if (result[0]) {
                // We had a failure during selection, so jump out
                // Fire selection change if we did deselect anything
                me.maybeFireSelectionChange(result[1] > 0 && !suppressEvent);
                return;
            } else {
                // Means something has been deselected, so we've had a change
                change = result[1] > 0;
            }
        }

        let gotBlocked,
            blockedRecords = [];
        commit = function () {
            if (!selected.getCount()) {
                me.selectionStart = record;
            }
            gotBlocked = false;
            change = true;
        };

        for (i = 0; i < len; i++) {
            record = records[i];
            if (me.isSelected(record)) {
                continue;
            }

            gotBlocked = true;
            me.onSelectChange(record, true, suppressEvent, commit);
            if (me.destroyed) {
                return;
            }
            if (gotBlocked) {
                blockedRecords.push(record);
            }
        }
        if (blockedRecords.length > 0) {
            records.remove(blockedRecords);
        }
        selected.add(records);
        me.lastSelected = record;

        // fire selchange if there was a change and there is no suppressEvent flag
        me.maybeFireSelectionChange(change && !suppressEvent);
    },
    deselectDuringSelect: function (toSelect, suppressEvent) {
        var me = this,
            selected = me.selected.getRange(),
            changed = 0,
            failed = false;
        // Prevent selection change events from firing, will happen during select
        me.suspendChanges();
        me.deselectingDuringSelect = true;
        let toDeselect = selected.filter((item) => !Ext.Array.contains(toSelect, item));
        if (toDeselect.length > 0) {
            changed = me.doDeselect(toDeselect, suppressEvent);
            if (!changed) {
                failed = true;
            }
            if (me.destroyed) {
                failed = true;
                changed = 0;
            }
        }
        me.deselectingDuringSelect = false;
        me.resumeChanges();
        return [failed, changed];
    },
});

// stop nulling of properties
Ext.define('Proxmox.Component', {
    override: 'Ext.Component',
    clearPropertiesOnDestroy: false,
});

// Fix drag&drop for vms and desktops that detect 'pen' pointerType
// NOTE: this part has been rewritten in ExtJS 7.4, so re-check once we can upgrade
Ext.define('Proxmox.view.DragZone', {
    override: 'Ext.view.DragZone',

    onItemMouseDown: function (view, record, item, index, e) {
        // Ignore touchstart.
        // For touch events, we use longpress.
        if (e.pointerType !== 'touch') {
            this.onTriggerGesture(view, record, item, index, e);
        }
    },
});

// Fix text selection on drag when using DragZone,
// see https://forum.sencha.com/forum/showthread.php?335100
Ext.define('Proxmox.dd.DragDropManager', {
    override: 'Ext.dd.DragDropManager',

    stopEvent: function (e) {
        if (this.stopPropagation) {
            e.stopPropagation();
        }

        if (this.preventDefault) {
            e.preventDefault();
        }
    },
});

// make it possible to set the SameSite attribute on cookies
Ext.define('Proxmox.Cookies', {
    override: 'Ext.util.Cookies',

    set: function (name, value, expires, path, domain, secure, samesite) {
        let attrs = [];

        if (expires) {
            attrs.push('expires=' + expires.toUTCString());
        }

        if (path === undefined) {
            // mimic original function's behaviour
            attrs.push('path=/');
        } else if (path) {
            attrs.push('path=' + path);
        }

        if (domain) {
            attrs.push('domain=' + domain);
        }

        if (secure === true) {
            attrs.push('secure');
        }

        if (samesite && ['lax', 'none', 'strict'].includes(samesite.toLowerCase())) {
            attrs.push('samesite=' + samesite);
        }

        document.cookie = name + '=' + escape(value) + '; ' + attrs.join('; ');
    },
});

// force alert boxes to be rendered with an Error Icon
// since Ext.Msg is an object and not a prototype, we need to override it
// after the framework has been initiated
Ext.onReady(function () {
    Ext.override(Ext.Msg, {
        alert: function (title, message, fn, scope) {
            if (Ext.isString(title)) {
                let config = {
                    title: title,
                    message: message,
                    icon: this.ERROR,
                    buttons: this.OK,
                    fn: fn,
                    scope: scope,
                    minWidth: this.minWidth,
                };
                return this.show(config);
            }
        },
    });
});

// add allowfullscreen to render template to allow the noVNC/xterm.js embedded UIs to go fullscreen
//
// The rest is the same as in the separate ux package (extjs/build/packages/ux/classic/ux-debug.js),
// which we do not load as it's rather big and most of the widgets there are not useful for our UIs
Ext.define('Ext.ux.IFrame', {
    extend: 'Ext.Component',

    alias: 'widget.uxiframe',

    loadMask: 'Loading...',

    src: 'about:blank',

    renderTpl: [
        '<iframe src="{src}" id="{id}-iframeEl" data-ref="iframeEl" name="{frameName}" width="100%" height="100%" frameborder="0" allowfullscreen="true"></iframe>',
    ],

    childEls: ['iframeEl'],

    initComponent: function () {
        this.callParent();

        this.frameName = this.frameName || this.id + '-frame';
    },

    initEvents: function () {
        let me = this;

        me.callParent();
        me.iframeEl.on('load', me.onLoad, me);
    },

    initRenderData: function () {
        return Ext.apply(this.callParent(), {
            src: this.src,
            frameName: this.frameName,
        });
    },

    getBody: function () {
        let doc = this.getDoc();

        return doc.body || doc.documentElement;
    },

    getDoc: function () {
        try {
            return this.getWin().document;
        } catch (_ex) {
            return null;
        }
    },

    getWin: function () {
        let me = this,
            name = me.frameName,
            win = Ext.isIE ? me.iframeEl.dom.contentWindow : window.frames[name];

        return win;
    },

    getFrame: function () {
        let me = this;

        return me.iframeEl.dom;
    },

    onLoad: function () {
        let me = this,
            doc = me.getDoc();

        if (doc) {
            this.el.unmask();
            this.fireEvent('load', this);
        } else if (me.src) {
            this.el.unmask();
            this.fireEvent('error', this);
        }
    },

    load: function (src) {
        let me = this,
            text = me.loadMask,
            frame = me.getFrame();

        if (me.fireEvent('beforeload', me, src) !== false) {
            if (text && me.el) {
                me.el.mask(text);
            }

            frame.src = me.src = src || me.src;
        }
    },
});
Ext.define('PMX.image.Logo', {
    extend: 'Ext.Img',
    xtype: 'proxmoxlogo',

    height: 30,
    width: 172,
    src: '/images/proxmox_logo.png',
    alt: 'Proxmox',
    autoEl: {
        tag: 'a',
        href: 'https://www.proxmox.com',
        target: '_blank',
    },

    initComponent: function () {
        let me = this;
        let prefix = me.prefix !== undefined ? me.prefix : '/pve2';
        me.src = prefix + me.src;
        me.callParent();
    },
});

Ext.define('PMX.image.LogoSVG', {
    extend: 'Ext.Img',
    xtype: 'proxmoxLogoSvg',

    height: 35,
    width: 200,
    src: '/images/proxmox_logo.svg',
    alt: 'Proxmox',
    autoEl: {
        tag: 'a',
        href: 'https://www.proxmox.com',
        target: '_blank',
    },

    initComponent: function () {
        let me = this;
        let prefix = me.prefix !== undefined ? me.prefix : '/pve2';
        me.src = prefix + me.src;
        me.callParent();
    },
});
// NOTE: just relays parsing to markedjs parser
Ext.define('Proxmox.Markdown', {
    alternateClassName: 'Px.Markdown', // just trying out something, do NOT copy this line
    singleton: true,

    // transforms HTML to a DOM tree and recursively descends and HTML-encodes every branch with a
    // "bad" node.type and drops "bad" attributes from the remaining nodes.
    // "bad" means anything which can do XSS or break the layout of the outer page
    sanitizeHTML: function (input) {
        if (!input) {
            return input;
        }
        let _isHTTPLike = (value) => value.match(/^\s*https?:/i); // URL's protocol ends with :
        let _sanitize;
        _sanitize = (node) => {
            if (node.nodeType === 3) {
                return;
            }
            if (
                node.nodeType !== 1 ||
                /^(script|style|form|select|option|optgroup|map|area|canvas|textarea|applet|font|iframe|audio|video|object|embed|svg)$/i.test(
                    node.tagName,
                )
            ) {
                // could do node.remove() instead, but it's nicer UX if we keep the (encoded!) html
                node.outerHTML = Ext.String.htmlEncode(node.outerHTML);
                return;
            }
            for (let i = node.attributes.length; i--; ) {
                const name = node.attributes[i].name;
                const value = node.attributes[i].value;
                const canonicalTagName = node.tagName.toLowerCase();
                // TODO: we may want to also disallow class and id attrs
                if (
                    !/^(class|id|name|href|src|alt|align|valign|disabled|checked|start|type|target)$/i.test(
                        name,
                    )
                ) {
                    node.attributes.removeNamedItem(name);
                } else if ((name === 'href' || name === 'src') && !_isHTTPLike(value)) {
                    let safeURL = false;
                    try {
                        let url = new URL(value, window.location.origin);
                        safeURL = _isHTTPLike(url.protocol);
                        if (canonicalTagName === 'img' && url.protocol.toLowerCase() === 'data:') {
                            safeURL = true;
                        } else if (canonicalTagName === 'a') {
                            // allow most link protocols so admins can use short-cuts to, e.g., RDP
                            safeURL = url.protocol.toLowerCase() !== 'javascript:';
                        }
                        if (safeURL) {
                            node.attributes[i].value = url.href;
                        } else {
                            node.attributes.removeNamedItem(name);
                        }
                    } catch (_e) {
                        node.attributes.removeNamedItem(name);
                    }
                } else if (name === 'target' && canonicalTagName !== 'a') {
                    node.attributes.removeNamedItem(name);
                }
            }
            for (let i = node.childNodes.length; i--; ) {
                _sanitize(node.childNodes[i]);
            }
        };

        const doc = new DOMParser().parseFromString(
            `<!DOCTYPE html><html><body>${input}`,
            'text/html',
        );
        doc.normalize();

        _sanitize(doc.body);

        return doc.body.innerHTML;
    },

    parse: function (markdown) {
        /*global marked*/
        let unsafeHTML = marked.parse(markdown);

        return `<div class="pmx-md">${this.sanitizeHTML(unsafeHTML)}</div>`;
    },
});
/*
 * The Proxmox CBind mixin is intended to supplement the 'bind' mechanism
 * of ExtJS. In contrast to the 'bind', 'cbind' only acts during the creation
 * of the component, not during its lifetime. It's only applied once before
 * the 'initComponent' method is executed, and thus you have only access
 * to the basic initial configuration of it.
 *
 * You can use it to get a 'declarative' approach to component declaration,
 * even when you need to set some properties of sub-components dynamically
 * (e.g., the 'nodename'). It overwrites the given properties of the 'cbind'
 * object in the component with their computed values of the computed
 * cbind configuration object of the 'cbindData' function (or object).
 *
 * The cbind syntax is inspired by ExtJS' bind syntax ('{property}'), where
 * it is possible to negate values ('{!negated}'), access sub-properties of
 * objects ('{object.property}') and even use a getter function,
 * akin to viewModel formulas ('(get) => get("prop")') to execute more
 * complicated dependencies (e.g., urls).
 *
 * The 'cbind' will be recursively applied to all properties (objects/arrays)
 * that contain an 'xtype' or 'cbind' property, but stops for a subtree if the
 * object in question does not have either (if you have one or more levels that
 * have no cbind/xtype property, you can insert empty cbind objects there to
 * reach deeper nested objects).
 *
 * This reduces the code in the 'initComponent' and instead we can statically
 * declare items, buttons, tbars, etc. while the dynamic parts are contained
 * in the 'cbind'.
 *
 * It is used like in the following example:
 *
 * Ext.define('Some.Component', {
 *     extend: 'Some.other.Component',
 *
 *     // first it has to be enabled
 *     mixins: ['Proxmox.Mixin.CBind'],
 *
 *     // then a base config has to be defined. this can be a function,
 *     // which has access to the initial config and can store persistent
 *     // properties, as well as return temporary ones (which only exist during
 *     // the cbind process)
 *     // this function will be called before 'initComponent'
 *     cbindData: function(initialconfig) {
 *         // 'this' here is the same as in 'initComponent'
 *         let me = this;
 *         me.persistentProperty = false;
 *         return {
 *             temporaryProperty: true,
 *         };
 *     },
 *
 *     // if there is no need for persistent properties, it can also simply be an object
 *     cbindData: {
 *         temporaryProperty: true,
 *         // properties itself can also be functions that will be evaluated before
 *         // replacing the values
 *         dynamicProperty: (cfg) => !cfg.temporaryProperty,
 *         numericProp: 0,
 *         objectProp: {
 *             foo: 'bar',
 *             bar: 'baz',
 *         }
 *     },
 *
 *     // you can 'cbind' the component itself, here the 'target' property
 *     // will be replaced with the content of 'temporaryProperty' (true)
 *     // before the components initComponent
 *     cbind: {
 *          target: '{temporaryProperty}',
 *     },
 *
 *     items: [
 *         {
 *             xtype: 'checkbox',
 *             cbind: {
 *                 value: '{!persistentProperty}',
 *                 object: '{objectProp.foo}'
 *                 dynamic: (get) => get('numericProp') + 1,
 *             },
 *         },
 *         {
 *             // empty cbind so that subitems are reached
 *             cbind: {},
 *             items: [
 *                 {
 *                     xtype: 'textfield',
 *                     cbind: {
 *                         value: '{objectProp.bar}',
 *                     },
 *                 },
 *             ],
 *         },
 *     ],
 * });
 */

Ext.define('Proxmox.Mixin.CBind', {
    extend: 'Ext.Mixin',

    mixinConfig: {
        before: {
            initComponent: 'cloneTemplates',
        },
    },

    cloneTemplates: function () {
        let me = this;

        if (typeof me.cbindData === 'function') {
            me.cbindData = me.cbindData(me.initialConfig);
        }
        me.cbindData = me.cbindData || {};

        let getConfigValue = function (cname) {
            if (cname in me.initialConfig) {
                return me.initialConfig[cname];
            }
            if (cname in me.cbindData) {
                let res = me.cbindData[cname];
                if (typeof res === 'function') {
                    return res(me.initialConfig);
                } else {
                    return res;
                }
            }
            if (cname in me) {
                return me[cname];
            }
            throw "unable to get cbind data for '" + cname + "'";
        };

        let applyCBind = function (obj) {
            let cbind = obj.cbind,
                cdata;
            if (!cbind) {
                return;
            }

            // biome-ignore lint/suspicious/useGuardForIn: loop over everything
            for (const prop in cbind) {
                let match, found;
                cdata = cbind[prop];

                found = false;
                if (typeof cdata === 'function') {
                    obj[prop] = cdata(getConfigValue, prop);
                    found = true;
                } else if ((match = /^\{(!)?([a-z_][a-z0-9_]*)\}$/i.exec(cdata))) {
                    let cvalue = getConfigValue(match[2]);
                    if (match[1]) {
                        cvalue = !cvalue;
                    }
                    obj[prop] = cvalue;
                    found = true;
                } else if (
                    (match = /^\{(!)?([a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)+)\}$/i.exec(cdata))
                ) {
                    let keys = match[2].split('.');
                    let cvalue = getConfigValue(keys.shift());
                    keys.forEach(function (k) {
                        if (k in cvalue) {
                            cvalue = cvalue[k];
                        } else {
                            throw "unable to get cbind data for '" + match[2] + "'";
                        }
                    });
                    if (match[1]) {
                        cvalue = !cvalue;
                    }
                    obj[prop] = cvalue;
                    found = true;
                } else {
                    obj[prop] = cdata.replace(/{([a-z_][a-z0-9_]*)\}/gi, (_match, cname) => {
                        let cvalue = getConfigValue(cname);
                        found = true;
                        return cvalue;
                    });
                }
                if (!found) {
                    throw "unable to parse cbind template '" + cdata + "'";
                }
            }
        };

        if (me.cbind) {
            applyCBind(me);
        }

        let cloneTemplateObject;
        let cloneTemplateArray = function (org) {
            let copy, i, found, el, elcopy, arrayLength;

            arrayLength = org.length;
            found = false;
            for (i = 0; i < arrayLength; i++) {
                el = org[i];
                if (el.constructor === Object && (el.xtype || el.cbind)) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                return org; // no need to copy
            }

            copy = [];
            for (i = 0; i < arrayLength; i++) {
                el = org[i];
                if (el.constructor === Object && (el.xtype || el.cbind)) {
                    elcopy = cloneTemplateObject(el);
                    if (elcopy.cbind) {
                        applyCBind(elcopy);
                    }
                    copy.push(elcopy);
                } else if (el.constructor === Array) {
                    elcopy = cloneTemplateArray(el);
                    copy.push(elcopy);
                } else {
                    copy.push(el);
                }
            }
            return copy;
        };

        cloneTemplateObject = function (org) {
            let res = {},
                prop,
                el,
                copy;
            // biome-ignore lint/suspicious/useGuardForIn: loop over everything
            for (prop in org) {
                el = org[prop];
                if (el === undefined || el === null) {
                    res[prop] = el;
                    continue;
                }
                if (el.constructor === Object && (el.xtype || el.cbind)) {
                    copy = cloneTemplateObject(el);
                    if (copy.cbind) {
                        applyCBind(copy);
                    }
                    res[prop] = copy;
                } else if (el.constructor === Array) {
                    copy = cloneTemplateArray(el);
                    res[prop] = copy;
                } else {
                    res[prop] = el;
                }
            }
            return res;
        };

        let condCloneProperties = function () {
            let prop, el, tmp;

            // biome-ignore lint/suspicious/useGuardForIn: loop over everything
            for (prop in me) {
                el = me[prop];
                if (el === undefined || el === null) {
                    continue;
                }
                if (typeof el === 'object' && el.constructor === Object) {
                    if ((el.xtype || el.cbind) && prop !== 'config') {
                        me[prop] = cloneTemplateObject(el);
                    }
                } else if (el.constructor === Array) {
                    tmp = cloneTemplateArray(el);
                    me[prop] = tmp;
                }
            }
        };

        condCloneProperties();
    },
});
/* A reader to store a single JSON Object (hash) into a storage.
 * Also accepts an array containing a single hash.
 *
 * So it can read:
 *
 * example1: {data1: "xyz", data2: "abc"}
 * returns [{key: "data1", value: "xyz"}, {key: "data2", value: "abc"}]
 *
 * example2: [ {data1: "xyz", data2: "abc"} ]
 * returns [{key: "data1", value: "xyz"}, {key: "data2", value: "abc"}]
 *
 * If you set 'readArray', the reader expects the object as array:
 *
 * example3: [ { key: "data1", value: "xyz", p2: "cde" },  { key: "data2", value: "abc", p2: "efg" }]
 * returns [{key: "data1", value: "xyz", p2: "cde}, {key: "data2", value: "abc", p2: "efg"}]
 *
 * Note: The records can contain additional properties (like 'p2' above) when you use 'readArray'
 *
 * Additional feature: specify allowed properties with default values with 'rows' object
 *
 * let rows = {
 *   memory: {
 *     required: true,
 *     defaultValue: 512
 *   }
 * }
 *
 */

Ext.define('Proxmox.data.reader.JsonObject', {
    extend: 'Ext.data.reader.Json',
    alias: 'reader.jsonobject',

    readArray: false,
    responseType: undefined,

    rows: undefined,

    constructor: function (config) {
        let me = this;

        Ext.apply(me, config || {});

        me.callParent([config]);
    },

    getResponseData: function (response) {
        let me = this;

        let data = [];
        try {
            let result = Ext.decode(response.responseText);
            // get our data items inside the server response
            let root = result[me.getRootProperty()];

            if (me.readArray) {
                // it can be more convenient for the backend to return null instead of an empty array
                if (root === null) {
                    root = [];
                }
                let rec_hash = {};
                Ext.Array.each(root, function (rec) {
                    if (Ext.isDefined(rec.key)) {
                        rec_hash[rec.key] = rec;
                    }
                });

                if (me.rows) {
                    Ext.Object.each(me.rows, function (key, rowdef) {
                        let rec = rec_hash[key];
                        if (Ext.isDefined(rec)) {
                            if (!Ext.isDefined(rec.value)) {
                                rec.value = rowdef.defaultValue;
                            }
                            data.push(rec);
                        } else if (Ext.isDefined(rowdef.defaultValue)) {
                            data.push({ key: key, value: rowdef.defaultValue });
                        } else if (rowdef.required) {
                            data.push({ key: key, value: undefined });
                        }
                    });
                } else {
                    Ext.Array.each(root, function (rec) {
                        if (Ext.isDefined(rec.key)) {
                            data.push(rec);
                        }
                    });
                }
            } else {
                // it can be more convenient for the backend to return null instead of an empty object
                if (root === null) {
                    root = {};
                } else if (Ext.isArray(root)) {
                    if (root.length === 1) {
                        root = root[0];
                    } else {
                        root = {};
                    }
                }

                if (me.rows) {
                    Ext.Object.each(me.rows, function (key, rowdef) {
                        if (Ext.isDefined(root[key])) {
                            data.push({ key: key, value: root[key] });
                        } else if (Ext.isDefined(rowdef.defaultValue)) {
                            data.push({ key: key, value: rowdef.defaultValue });
                        } else if (rowdef.required) {
                            data.push({ key: key, value: undefined });
                        }
                    });
                } else {
                    Ext.Object.each(root, function (key, value) {
                        data.push({ key: key, value: value });
                    });
                }
            }
        } catch (ex) {
            Ext.Error.raise({
                response: response,
                json: response.responseText,
                parseError: ex,
                msg: 'Unable to parse the JSON returned by the server: ' + ex.toString(),
            });
        }

        return data;
    },
});
Ext.define(
    'Proxmox.RestProxy',
    {
        extend: 'Ext.data.RestProxy',
        alias: 'proxy.proxmox',

        pageParam: null,
        startParam: null,
        limitParam: null,
        groupParam: null,
        sortParam: null,
        filterParam: null,
        noCache: false,

        afterRequest: function (request, success) {
            this.fireEvent('afterload', this, request, success);
        },

        constructor: function (config) {
            Ext.applyIf(config, {
                reader: {
                    responseType: undefined,
                    type: 'json',
                    rootProperty: config.root || 'data',
                },
            });

            this.callParent([config]);
        },
    },
    function () {
        Ext.define('KeyValue', {
            extend: 'Ext.data.Model',
            fields: ['key', 'value'],
            idProperty: 'key',
        });

        Ext.define('KeyValuePendingDelete', {
            extend: 'Ext.data.Model',
            fields: ['key', 'value', 'pending', 'delete'],
            idProperty: 'key',
        });

        Ext.define('proxmox-tasks', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'starttime', type: 'date', dateFormat: 'timestamp' },
                { name: 'endtime', type: 'date', dateFormat: 'timestamp' },
                { name: 'pid', type: 'int' },
                {
                    name: 'duration',
                    sortType: 'asInt',
                    calculate: function (data) {
                        let endtime = data.endtime;
                        let starttime = data.starttime;
                        if (endtime !== undefined) {
                            return (endtime - starttime) / 1000;
                        }
                        return 0;
                    },
                },
                'node',
                'upid',
                'user',
                'tokenid',
                'status',
                'type',
                'id',
            ],
            idProperty: 'upid',
        });

        Ext.define('proxmox-cluster-log', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'uid', type: 'int' },
                { name: 'time', type: 'date', dateFormat: 'timestamp' },
                { name: 'pri', type: 'int' },
                { name: 'pid', type: 'int' },
                'node',
                'user',
                'tag',
                'msg',
                {
                    name: 'id',
                    convert: function (value, record) {
                        let info = record.data;

                        if (value) {
                            return value;
                        }
                        // compute unique ID
                        return info.uid + ':' + info.node;
                    },
                },
            ],
            idProperty: 'id',
        });
    },
);
/*
 * Extends the Ext.data.Store type with  startUpdate() and stopUpdate() methods
 * to refresh the store data in the background.
 * Components using this store directly will flicker due to the redisplay of
 * the element ater 'config.interval' ms.
 *
 * Note that you have to set 'autoStart' or call startUpdate() once yourself
 * for the background load to begin.
 */
Ext.define('Proxmox.data.UpdateStore', {
    extend: 'Ext.data.Store',
    alias: 'store.update',

    config: {
        interval: 3000,

        isStopped: true,

        autoStart: false,
    },

    destroy: function () {
        let me = this;
        me.stopUpdate();
        me.callParent();
    },

    constructor: function (config) {
        let me = this;

        config = config || {};
        if (config.interval === undefined) {
            delete config.interval;
        }

        let load_task = new Ext.util.DelayedTask();

        let run_load_task = function () {
            if (me.getIsStopped()) {
                return;
            }

            if (Proxmox.Utils.authOK()) {
                let start = new Date();
                me.load(function () {
                    let runtime = new Date() - start;
                    let interval = me.getInterval() + runtime * 2;
                    load_task.delay(interval, run_load_task);
                });
            } else {
                load_task.delay(200, run_load_task);
            }
        };

        Ext.apply(config, {
            startUpdate: function () {
                me.setIsStopped(false);
                // run_load_task(); this makes problems with chrome
                load_task.delay(1, run_load_task);
            },
            stopUpdate: function () {
                me.setIsStopped(true);
                load_task.cancel();
            },
        });

        me.callParent([config]);

        me.load_task = load_task;

        if (me.getAutoStart()) {
            me.startUpdate();
        }
    },
});
/*
 * The DiffStore is a in-memory store acting as proxy between a real store
 * instance and a component.
 * Its purpose is to redisplay the component *only* if the data has been changed
 * inside the real store, to avoid the annoying visual flickering of using
 * the real store directly.
 *
 * Implementation:
 * The DiffStore monitors via mon() the 'load' events sent by the real store.
 * On each 'load' event, the DiffStore compares its own content with the target
 * store (call to cond_add_item()) and then fires a 'refresh' event.
 * The 'refresh' event will automatically trigger a view refresh on the component
 * who binds to this store.
 */

/* Config properties:
 * rstore: the realstore which will autorefresh its content from the API
 * Only works if rstore has a model and use 'idProperty'
 * sortAfterUpdate: sort the diffstore before rendering the view
 */
Ext.define('Proxmox.data.DiffStore', {
    extend: 'Ext.data.Store',
    alias: 'store.diff',

    sortAfterUpdate: false,

    // if true, destroy rstore on destruction. Defaults to true if a rstore
    // config is passed instead of an existing rstore instance
    autoDestroyRstore: false,

    doDestroy: function () {
        let me = this;
        if (me.autoDestroyRstore) {
            if (Ext.isFunction(me.rstore.destroy)) {
                me.rstore.destroy();
            }
            delete me.rstore;
        }
        me.callParent();
    },

    constructor: function (config) {
        let me = this;

        config = config || {};

        if (!config.rstore) {
            throw 'no rstore specified';
        }

        if (!config.rstore.model) {
            throw 'no rstore model specified';
        }

        let rstore;
        if (config.rstore.isInstance) {
            rstore = config.rstore;
        } else if (config.rstore.type) {
            Ext.applyIf(config.rstore, {
                autoDestroyRstore: true,
            });
            rstore = Ext.create(`store.${config.rstore.type}`, config.rstore);
        } else {
            throw 'rstore is not an instance, and cannot autocreate without "type"';
        }

        Ext.apply(config, {
            model: rstore.model,
            proxy: { type: 'memory' },
        });

        me.callParent([config]);

        me.rstore = rstore;

        let first_load = true;

        let cond_add_item = function (data, id) {
            let olditem = me.getById(id);
            if (olditem) {
                olditem.beginEdit();
                Ext.Array.each(me.model.prototype.fields, function (field) {
                    if (olditem.data[field.name] !== data[field.name]) {
                        olditem.set(field.name, data[field.name]);
                    }
                });
                olditem.endEdit(true);
                olditem.commit();
            } else {
                let newrec = Ext.create(me.model, data);
                let pos = me.appendAtStart && !first_load ? 0 : me.data.length;
                me.insert(pos, newrec);
            }
        };

        let loadFn = function (s, records, success) {
            if (!success) {
                return;
            }

            me.suspendEvents();

            // getSource returns null if data is not filtered
            // if it is filtered it returns all records
            let allItems = me.getData().getSource() || me.getData();

            // remove vanished items
            allItems.each(function (olditem) {
                let item = me.rstore.getById(olditem.getId());
                if (!item) {
                    me.remove(olditem);
                }
            });

            me.rstore.each(function (item) {
                cond_add_item(item.data, item.getId());
            });

            me.filter();

            if (me.sortAfterUpdate) {
                me.sort();
            }

            first_load = false;

            me.resumeEvents();
            me.fireEvent('refresh', me);
            me.fireEvent('datachanged', me);
        };

        if (me.rstore.isLoaded()) {
            // if store is already loaded,
            // insert items instantly
            loadFn(me.rstore, [], true);
        }

        me.mon(me.rstore, 'load', loadFn);
    },
});
/* This store encapsulates data items which are organized as an Array of key-values Objects
 * ie data[0] contains something like {key: "keyboard", value: "da"}
 *
 * Designed to work with the KeyValue model and the JsonObject data reader
 */
Ext.define('Proxmox.data.ObjectStore', {
    extend: 'Proxmox.data.UpdateStore',

    getRecord: function () {
        let me = this;
        let record = Ext.create('Ext.data.Model');
        me.getData().each(function (item) {
            record.set(item.data.key, item.data.value);
        });
        record.commit(true);
        return record;
    },

    constructor: function (config) {
        let me = this;

        config = config || {};

        Ext.applyIf(config, {
            model: 'KeyValue',
            proxy: {
                type: 'proxmox',
                url: config.url,
                extraParams: config.extraParams,
                reader: {
                    type: 'jsonobject',
                    rows: config.rows,
                    readArray: config.readArray,
                    rootProperty: config.root || 'data',
                },
            },
        });

        me.callParent([config]);
    },
});
/* Extends the Proxmox.data.UpdateStore type
 *
 *
 */
Ext.define('Proxmox.data.RRDStore', {
    extend: 'Proxmox.data.UpdateStore',
    alias: 'store.proxmoxRRDStore',

    setRRDUrl: function (timeframe, cf) {
        let me = this;
        if (!timeframe) {
            timeframe = me.timeframe;
        }

        if (!cf) {
            cf = me.cf;
        }

        me.proxy.url = me.rrdurl + '?timeframe=' + timeframe + '&cf=' + cf;
    },

    proxy: {
        type: 'proxmox',
    },

    timeframe: 'hour',

    cf: 'AVERAGE',

    constructor: function (config) {
        let me = this;

        config = config || {};

        // set default interval to 30seconds
        if (!config.interval) {
            config.interval = 30000;
        }

        // rrdurl is required
        if (!config.rrdurl) {
            throw 'no rrdurl specified';
        }

        let stateid = 'proxmoxRRDTypeSelection';
        let sp = Ext.state.Manager.getProvider();
        let stateinit = sp.get(stateid);

        if (stateinit) {
            if (stateinit.timeframe !== me.timeframe || stateinit.cf !== me.rrdcffn) {
                me.timeframe = stateinit.timeframe;
                me.rrdcffn = stateinit.cf;
            }
        }

        me.callParent([config]);

        me.setRRDUrl();
        me.mon(sp, 'statechange', function (prov, key, state) {
            if (key === stateid) {
                if (state && state.id) {
                    if (state.timeframe !== me.timeframe || state.cf !== me.cf) {
                        me.timeframe = state.timeframe;
                        me.cf = state.cf;
                        me.setRRDUrl();
                        me.reload();
                    }
                }
            }
        });
    },
});
Ext.define('Timezone', {
    extend: 'Ext.data.Model',
    fields: ['zone'],
});

Ext.define('Proxmox.data.TimezoneStore', {
    extend: 'Ext.data.Store',
    model: 'Timezone',
    data: [
        ['Africa/Abidjan'],
        ['Africa/Accra'],
        ['Africa/Addis_Ababa'],
        ['Africa/Algiers'],
        ['Africa/Asmara'],
        ['Africa/Bamako'],
        ['Africa/Bangui'],
        ['Africa/Banjul'],
        ['Africa/Bissau'],
        ['Africa/Blantyre'],
        ['Africa/Brazzaville'],
        ['Africa/Bujumbura'],
        ['Africa/Cairo'],
        ['Africa/Casablanca'],
        ['Africa/Ceuta'],
        ['Africa/Conakry'],
        ['Africa/Dakar'],
        ['Africa/Dar_es_Salaam'],
        ['Africa/Djibouti'],
        ['Africa/Douala'],
        ['Africa/El_Aaiun'],
        ['Africa/Freetown'],
        ['Africa/Gaborone'],
        ['Africa/Harare'],
        ['Africa/Johannesburg'],
        ['Africa/Kampala'],
        ['Africa/Khartoum'],
        ['Africa/Kigali'],
        ['Africa/Kinshasa'],
        ['Africa/Lagos'],
        ['Africa/Libreville'],
        ['Africa/Lome'],
        ['Africa/Luanda'],
        ['Africa/Lubumbashi'],
        ['Africa/Lusaka'],
        ['Africa/Malabo'],
        ['Africa/Maputo'],
        ['Africa/Maseru'],
        ['Africa/Mbabane'],
        ['Africa/Mogadishu'],
        ['Africa/Monrovia'],
        ['Africa/Nairobi'],
        ['Africa/Ndjamena'],
        ['Africa/Niamey'],
        ['Africa/Nouakchott'],
        ['Africa/Ouagadougou'],
        ['Africa/Porto-Novo'],
        ['Africa/Sao_Tome'],
        ['Africa/Tripoli'],
        ['Africa/Tunis'],
        ['Africa/Windhoek'],
        ['America/Adak'],
        ['America/Anchorage'],
        ['America/Anguilla'],
        ['America/Antigua'],
        ['America/Araguaina'],
        ['America/Argentina/Buenos_Aires'],
        ['America/Argentina/Catamarca'],
        ['America/Argentina/Cordoba'],
        ['America/Argentina/Jujuy'],
        ['America/Argentina/La_Rioja'],
        ['America/Argentina/Mendoza'],
        ['America/Argentina/Rio_Gallegos'],
        ['America/Argentina/Salta'],
        ['America/Argentina/San_Juan'],
        ['America/Argentina/San_Luis'],
        ['America/Argentina/Tucuman'],
        ['America/Argentina/Ushuaia'],
        ['America/Aruba'],
        ['America/Asuncion'],
        ['America/Atikokan'],
        ['America/Bahia'],
        ['America/Bahia_Banderas'],
        ['America/Barbados'],
        ['America/Belem'],
        ['America/Belize'],
        ['America/Blanc-Sablon'],
        ['America/Boa_Vista'],
        ['America/Bogota'],
        ['America/Boise'],
        ['America/Cambridge_Bay'],
        ['America/Campo_Grande'],
        ['America/Cancun'],
        ['America/Caracas'],
        ['America/Cayenne'],
        ['America/Cayman'],
        ['America/Chicago'],
        ['America/Chihuahua'],
        ['America/Costa_Rica'],
        ['America/Cuiaba'],
        ['America/Curacao'],
        ['America/Danmarkshavn'],
        ['America/Dawson'],
        ['America/Dawson_Creek'],
        ['America/Denver'],
        ['America/Detroit'],
        ['America/Dominica'],
        ['America/Edmonton'],
        ['America/Eirunepe'],
        ['America/El_Salvador'],
        ['America/Fortaleza'],
        ['America/Glace_Bay'],
        ['America/Godthab'],
        ['America/Goose_Bay'],
        ['America/Grand_Turk'],
        ['America/Grenada'],
        ['America/Guadeloupe'],
        ['America/Guatemala'],
        ['America/Guayaquil'],
        ['America/Guyana'],
        ['America/Halifax'],
        ['America/Havana'],
        ['America/Hermosillo'],
        ['America/Indiana/Indianapolis'],
        ['America/Indiana/Knox'],
        ['America/Indiana/Marengo'],
        ['America/Indiana/Petersburg'],
        ['America/Indiana/Tell_City'],
        ['America/Indiana/Vevay'],
        ['America/Indiana/Vincennes'],
        ['America/Indiana/Winamac'],
        ['America/Inuvik'],
        ['America/Iqaluit'],
        ['America/Jamaica'],
        ['America/Juneau'],
        ['America/Kentucky/Louisville'],
        ['America/Kentucky/Monticello'],
        ['America/La_Paz'],
        ['America/Lima'],
        ['America/Los_Angeles'],
        ['America/Maceio'],
        ['America/Managua'],
        ['America/Manaus'],
        ['America/Marigot'],
        ['America/Martinique'],
        ['America/Matamoros'],
        ['America/Mazatlan'],
        ['America/Menominee'],
        ['America/Merida'],
        ['America/Mexico_City'],
        ['America/Miquelon'],
        ['America/Moncton'],
        ['America/Monterrey'],
        ['America/Montevideo'],
        ['America/Montreal'],
        ['America/Montserrat'],
        ['America/Nassau'],
        ['America/New_York'],
        ['America/Nipigon'],
        ['America/Nome'],
        ['America/Noronha'],
        ['America/North_Dakota/Center'],
        ['America/North_Dakota/New_Salem'],
        ['America/Ojinaga'],
        ['America/Panama'],
        ['America/Pangnirtung'],
        ['America/Paramaribo'],
        ['America/Phoenix'],
        ['America/Port-au-Prince'],
        ['America/Port_of_Spain'],
        ['America/Porto_Velho'],
        ['America/Puerto_Rico'],
        ['America/Rainy_River'],
        ['America/Rankin_Inlet'],
        ['America/Recife'],
        ['America/Regina'],
        ['America/Resolute'],
        ['America/Rio_Branco'],
        ['America/Santa_Isabel'],
        ['America/Santarem'],
        ['America/Santiago'],
        ['America/Santo_Domingo'],
        ['America/Sao_Paulo'],
        ['America/Scoresbysund'],
        ['America/Shiprock'],
        ['America/St_Barthelemy'],
        ['America/St_Johns'],
        ['America/St_Kitts'],
        ['America/St_Lucia'],
        ['America/St_Thomas'],
        ['America/St_Vincent'],
        ['America/Swift_Current'],
        ['America/Tegucigalpa'],
        ['America/Thule'],
        ['America/Thunder_Bay'],
        ['America/Tijuana'],
        ['America/Toronto'],
        ['America/Tortola'],
        ['America/Vancouver'],
        ['America/Whitehorse'],
        ['America/Winnipeg'],
        ['America/Yakutat'],
        ['America/Yellowknife'],
        ['Antarctica/Casey'],
        ['Antarctica/Davis'],
        ['Antarctica/DumontDUrville'],
        ['Antarctica/Macquarie'],
        ['Antarctica/Mawson'],
        ['Antarctica/McMurdo'],
        ['Antarctica/Palmer'],
        ['Antarctica/Rothera'],
        ['Antarctica/South_Pole'],
        ['Antarctica/Syowa'],
        ['Antarctica/Vostok'],
        ['Arctic/Longyearbyen'],
        ['Asia/Aden'],
        ['Asia/Almaty'],
        ['Asia/Amman'],
        ['Asia/Anadyr'],
        ['Asia/Aqtau'],
        ['Asia/Aqtobe'],
        ['Asia/Ashgabat'],
        ['Asia/Baghdad'],
        ['Asia/Bahrain'],
        ['Asia/Baku'],
        ['Asia/Bangkok'],
        ['Asia/Beirut'],
        ['Asia/Bishkek'],
        ['Asia/Brunei'],
        ['Asia/Choibalsan'],
        ['Asia/Chongqing'],
        ['Asia/Colombo'],
        ['Asia/Damascus'],
        ['Asia/Dhaka'],
        ['Asia/Dili'],
        ['Asia/Dubai'],
        ['Asia/Dushanbe'],
        ['Asia/Gaza'],
        ['Asia/Harbin'],
        ['Asia/Ho_Chi_Minh'],
        ['Asia/Hong_Kong'],
        ['Asia/Hovd'],
        ['Asia/Irkutsk'],
        ['Asia/Jakarta'],
        ['Asia/Jayapura'],
        ['Asia/Jerusalem'],
        ['Asia/Kabul'],
        ['Asia/Kamchatka'],
        ['Asia/Karachi'],
        ['Asia/Kashgar'],
        ['Asia/Kathmandu'],
        ['Asia/Kolkata'],
        ['Asia/Krasnoyarsk'],
        ['Asia/Kuala_Lumpur'],
        ['Asia/Kuching'],
        ['Asia/Kuwait'],
        ['Asia/Macau'],
        ['Asia/Magadan'],
        ['Asia/Makassar'],
        ['Asia/Manila'],
        ['Asia/Muscat'],
        ['Asia/Nicosia'],
        ['Asia/Novokuznetsk'],
        ['Asia/Novosibirsk'],
        ['Asia/Omsk'],
        ['Asia/Oral'],
        ['Asia/Phnom_Penh'],
        ['Asia/Pontianak'],
        ['Asia/Pyongyang'],
        ['Asia/Qatar'],
        ['Asia/Qyzylorda'],
        ['Asia/Rangoon'],
        ['Asia/Riyadh'],
        ['Asia/Sakhalin'],
        ['Asia/Samarkand'],
        ['Asia/Seoul'],
        ['Asia/Shanghai'],
        ['Asia/Singapore'],
        ['Asia/Taipei'],
        ['Asia/Tashkent'],
        ['Asia/Tbilisi'],
        ['Asia/Tehran'],
        ['Asia/Thimphu'],
        ['Asia/Tokyo'],
        ['Asia/Ulaanbaatar'],
        ['Asia/Urumqi'],
        ['Asia/Vientiane'],
        ['Asia/Vladivostok'],
        ['Asia/Yakutsk'],
        ['Asia/Yekaterinburg'],
        ['Asia/Yerevan'],
        ['Atlantic/Azores'],
        ['Atlantic/Bermuda'],
        ['Atlantic/Canary'],
        ['Atlantic/Cape_Verde'],
        ['Atlantic/Faroe'],
        ['Atlantic/Madeira'],
        ['Atlantic/Reykjavik'],
        ['Atlantic/South_Georgia'],
        ['Atlantic/St_Helena'],
        ['Atlantic/Stanley'],
        ['Australia/Adelaide'],
        ['Australia/Brisbane'],
        ['Australia/Broken_Hill'],
        ['Australia/Currie'],
        ['Australia/Darwin'],
        ['Australia/Eucla'],
        ['Australia/Hobart'],
        ['Australia/Lindeman'],
        ['Australia/Lord_Howe'],
        ['Australia/Melbourne'],
        ['Australia/Perth'],
        ['Australia/Sydney'],
        ['Europe/Amsterdam'],
        ['Europe/Andorra'],
        ['Europe/Athens'],
        ['Europe/Belgrade'],
        ['Europe/Berlin'],
        ['Europe/Bratislava'],
        ['Europe/Brussels'],
        ['Europe/Bucharest'],
        ['Europe/Budapest'],
        ['Europe/Chisinau'],
        ['Europe/Copenhagen'],
        ['Europe/Dublin'],
        ['Europe/Gibraltar'],
        ['Europe/Guernsey'],
        ['Europe/Helsinki'],
        ['Europe/Isle_of_Man'],
        ['Europe/Istanbul'],
        ['Europe/Jersey'],
        ['Europe/Kaliningrad'],
        ['Europe/Kiev'],
        ['Europe/Lisbon'],
        ['Europe/Ljubljana'],
        ['Europe/London'],
        ['Europe/Luxembourg'],
        ['Europe/Madrid'],
        ['Europe/Malta'],
        ['Europe/Mariehamn'],
        ['Europe/Minsk'],
        ['Europe/Monaco'],
        ['Europe/Moscow'],
        ['Europe/Oslo'],
        ['Europe/Paris'],
        ['Europe/Podgorica'],
        ['Europe/Prague'],
        ['Europe/Riga'],
        ['Europe/Rome'],
        ['Europe/Samara'],
        ['Europe/San_Marino'],
        ['Europe/Sarajevo'],
        ['Europe/Simferopol'],
        ['Europe/Skopje'],
        ['Europe/Sofia'],
        ['Europe/Stockholm'],
        ['Europe/Tallinn'],
        ['Europe/Tirane'],
        ['Europe/Uzhgorod'],
        ['Europe/Vaduz'],
        ['Europe/Vatican'],
        ['Europe/Vienna'],
        ['Europe/Vilnius'],
        ['Europe/Volgograd'],
        ['Europe/Warsaw'],
        ['Europe/Zagreb'],
        ['Europe/Zaporozhye'],
        ['Europe/Zurich'],
        ['Indian/Antananarivo'],
        ['Indian/Chagos'],
        ['Indian/Christmas'],
        ['Indian/Cocos'],
        ['Indian/Comoro'],
        ['Indian/Kerguelen'],
        ['Indian/Mahe'],
        ['Indian/Maldives'],
        ['Indian/Mauritius'],
        ['Indian/Mayotte'],
        ['Indian/Reunion'],
        ['Pacific/Apia'],
        ['Pacific/Auckland'],
        ['Pacific/Chatham'],
        ['Pacific/Chuuk'],
        ['Pacific/Easter'],
        ['Pacific/Efate'],
        ['Pacific/Enderbury'],
        ['Pacific/Fakaofo'],
        ['Pacific/Fiji'],
        ['Pacific/Funafuti'],
        ['Pacific/Galapagos'],
        ['Pacific/Gambier'],
        ['Pacific/Guadalcanal'],
        ['Pacific/Guam'],
        ['Pacific/Honolulu'],
        ['Pacific/Johnston'],
        ['Pacific/Kiritimati'],
        ['Pacific/Kosrae'],
        ['Pacific/Kwajalein'],
        ['Pacific/Majuro'],
        ['Pacific/Marquesas'],
        ['Pacific/Midway'],
        ['Pacific/Nauru'],
        ['Pacific/Niue'],
        ['Pacific/Norfolk'],
        ['Pacific/Noumea'],
        ['Pacific/Pago_Pago'],
        ['Pacific/Palau'],
        ['Pacific/Pitcairn'],
        ['Pacific/Pohnpei'],
        ['Pacific/Port_Moresby'],
        ['Pacific/Rarotonga'],
        ['Pacific/Saipan'],
        ['Pacific/Tahiti'],
        ['Pacific/Tarawa'],
        ['Pacific/Tongatapu'],
        ['Pacific/Wake'],
        ['Pacific/Wallis'],
        ['UTC'],
    ],
});
Ext.define('proxmox-notification-endpoints', {
    extend: 'Ext.data.Model',
    fields: ['name', 'type', 'comment', 'disable', 'origin'],
    proxy: {
        type: 'proxmox',
    },
    idProperty: 'name',
});

Ext.define('proxmox-notification-matchers', {
    extend: 'Ext.data.Model',
    fields: ['name', 'comment', 'disable', 'origin'],
    proxy: {
        type: 'proxmox',
    },
    idProperty: 'name',
});

Ext.define('proxmox-notification-fields', {
    extend: 'Ext.data.Model',
    fields: ['name', 'description'],
    idProperty: 'name',
});

Ext.define('proxmox-notification-field-values', {
    extend: 'Ext.data.Model',
    fields: ['value', 'comment', 'field'],
    idProperty: 'value',
});
Ext.define('pmx-domains', {
    extend: 'Ext.data.Model',
    fields: [
        'realm',
        'type',
        'comment',
        'default',
        {
            name: 'tfa',
            allowNull: true,
        },
        {
            name: 'descr',
            convert: function (value, { data = {} }) {
                if (value) {
                    return Ext.String.htmlEncode(value);
                }

                let text = data.comment || data.realm;

                if (data.tfa) {
                    text += ` (+ ${data.tfa})`;
                }

                return Ext.String.htmlEncode(text);
            },
        },
    ],
    idProperty: 'realm',
    proxy: {
        type: 'proxmox',
        url: '/api2/json/access/domains',
    },
});
Ext.define('proxmox-certificate', {
    extend: 'Ext.data.Model',

    fields: [
        'filename',
        'fingerprint',
        'issuer',
        'notafter',
        'notbefore',
        'subject',
        'san',
        'public-key-bits',
        'public-key-type',
    ],
    idProperty: 'filename',
});
Ext.define('proxmox-acme-accounts', {
    extend: 'Ext.data.Model',
    fields: ['name'],
    proxy: {
        type: 'proxmox',
    },
    idProperty: 'name',
});

Ext.define('proxmox-acme-challenges', {
    extend: 'Ext.data.Model',
    fields: ['id', 'type', 'schema'],
    proxy: {
        type: 'proxmox',
    },
    idProperty: 'id',
});

Ext.define('proxmox-acme-plugins', {
    extend: 'Ext.data.Model',
    fields: ['type', 'plugin', 'api'],
    proxy: {
        type: 'proxmox',
    },
    idProperty: 'plugin',
});
Ext.define('Proxmox.form.SizeField', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.pmxSizeField',

    mixins: ['Proxmox.Mixin.CBind'],

    viewModel: {
        data: {
            unit: 'MiB',
            unitPostfix: '',
        },
        formulas: {
            unitlabel: (get) => get('unit') + get('unitPostfix'),
        },
    },

    emptyText: '',

    layout: 'hbox',
    defaults: {
        hideLabel: true,
    },

    // display unit (TODO: make (optionally) selectable)
    unit: 'MiB',
    unitPostfix: '',

    // use this if the backend saves values in another unit than bytes, e.g.,
    // for KiB set it to 'KiB'
    backendUnit: undefined,

    // submit a canonical size unit, e.g., 20.5 MiB
    submitAutoScaledSizeUnit: false,

    // allow setting 0 and using it as a submit value
    allowZero: false,

    emptyValue: null,

    items: [
        {
            xtype: 'numberfield',
            cbind: {
                name: '{name}',
                emptyText: '{emptyText}',
                allowZero: '{allowZero}',
                emptyValue: '{emptyValue}',
            },
            minValue: 0,
            step: 1,
            submitLocaleSeparator: false,
            fieldStyle: 'text-align: right',
            flex: 1,
            enableKeyEvents: true,
            setValue: function (v) {
                if (!this._transformed) {
                    let fieldContainer = this.up('fieldcontainer');
                    let vm = fieldContainer.getViewModel();
                    let unit = vm.get('unit');

                    if (typeof v === 'string') {
                        v = Proxmox.Utils.size_unit_to_bytes(v);
                    }
                    v /= Proxmox.Utils.SizeUnits[unit];
                    v *= fieldContainer.backendFactor;

                    this._transformed = true;
                }

                if (Number(v) === 0 && !this.allowZero) {
                    v = undefined;
                }

                return Ext.form.field.Text.prototype.setValue.call(this, v);
            },
            getSubmitValue: function () {
                let v = this.processRawValue(this.getRawValue());
                v = v.replace(this.decimalSeparator, '.');

                if (v === undefined || v === '') {
                    return this.emptyValue;
                }

                if (Number(v) === 0) {
                    return this.allowZero ? 0 : null;
                }

                let fieldContainer = this.up('fieldcontainer');
                let vm = fieldContainer.getViewModel();
                let unit = vm.get('unit');

                v = parseFloat(v) * Proxmox.Utils.SizeUnits[unit];

                if (fieldContainer.submitAutoScaledSizeUnit) {
                    return Proxmox.Utils.format_size(v, !unit.endsWith('iB'));
                } else {
                    return String(Math.floor(v / fieldContainer.backendFactor));
                }
            },
            listeners: {
                // our setValue gets only called if we have a value, avoid
                // transformation of the first user-entered value
                keydown: function () {
                    this._transformed = true;
                },
            },
        },
        {
            xtype: 'displayfield',
            name: 'unit',
            submitValue: false,
            padding: '0 0 0 10',
            bind: {
                value: '{unitlabel}',
            },
            listeners: {
                change: (f, v) => {
                    f.originalValue = v;
                },
            },
            width: 40,
        },
    ],

    initComponent: function () {
        let me = this;

        me.unit = me.unit || 'MiB';
        if (!(me.unit in Proxmox.Utils.SizeUnits)) {
            throw 'unknown unit: ' + me.unit;
        }

        me.backendFactor = 1;
        if (me.backendUnit !== undefined) {
            if (!(me.unit in Proxmox.Utils.SizeUnits)) {
                throw 'unknown backend unit: ' + me.backendUnit;
            }
            me.backendFactor = Proxmox.Utils.SizeUnits[me.backendUnit];
        }

        me.callParent(arguments);

        me.getViewModel().set('unit', me.unit);
        me.getViewModel().set('unitPostfix', me.unitPostfix);
    },
});

Ext.define('Proxmox.form.BandwidthField', {
    extend: 'Proxmox.form.SizeField',
    alias: 'widget.pmxBandwidthField',

    unitPostfix: '/s',
});
Ext.define('Proxmox.form.field.DisplayEdit', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.pmxDisplayEditField',

    viewModel: {
        parent: null,
        data: {
            editable: false,
            value: undefined,
        },
    },

    displayType: 'displayfield',

    editConfig: {},
    editable: false,
    setEditable: function (editable) {
        let me = this;
        let vm = me.getViewModel();

        me.editable = editable;
        vm.set('editable', editable);
    },
    getEditable: function () {
        let me = this;
        let vm = me.getViewModel();
        return vm.get('editable');
    },

    setValue: function (value) {
        let me = this;
        let vm = me.getViewModel();

        me.value = value;
        vm.set('value', value);
    },
    getValue: function () {
        let me = this;
        let vm = me.getViewModel();
        // FIXME: add return, but check all use-sites for regressions then
        vm.get('value');
    },

    setEmptyText: function (emptyText) {
        let me = this;
        me.editField.setEmptyText(emptyText);
    },
    getEmptyText: function () {
        let me = this;
        return me.editField.getEmptyText();
    },

    layout: 'fit',
    defaults: {
        hideLabel: true,
    },

    initComponent: function () {
        let me = this;

        let displayConfig = {
            xtype: me.displayType,
            bind: {},
        };
        Ext.applyIf(displayConfig, me.initialConfig);
        delete displayConfig.editConfig;
        delete displayConfig.editable;

        let editConfig = Ext.apply({}, me.editConfig);
        Ext.applyIf(editConfig, {
            xtype: 'textfield',
            bind: {},
        });
        Ext.applyIf(editConfig, displayConfig);

        if (me.initialConfig && me.initialConfig.displayConfig) {
            Ext.applyIf(displayConfig, me.initialConfig.displayConfig);
            delete displayConfig.displayConfig;
        }

        Ext.applyIf(displayConfig, {
            renderer: (v) => Ext.htmlEncode(v),
        });

        Ext.applyIf(displayConfig.bind, {
            hidden: '{editable}',
            disabled: '{editable}',
            value: '{value}',
        });
        Ext.applyIf(editConfig.bind, {
            hidden: '{!editable}',
            disabled: '{!editable}',
            value: '{value}',
        });

        // avoid glitch, start off correct even before viewmodel fixes it
        editConfig.disabled = editConfig.hidden = !me.editable;
        displayConfig.disabled = displayConfig.hidden = !!me.editable;

        editConfig.name = displayConfig.name = me.name;

        Ext.apply(me, {
            items: [editConfig, displayConfig],
        });

        me.callParent();

        // save a reference to make it easier when one needs to operate on the underlying fields,
        // like when creating a passthrough getter/setter to allow easy data-binding.
        me.editField = me.down(editConfig.xtype);
        me.displayField = me.down(displayConfig.xtype);

        me.getViewModel().set('editable', me.editable);
    },
});
// treats 0 as "never expires"
Ext.define('Proxmox.form.field.ExpireDate', {
    extend: 'Ext.form.field.Date',
    alias: ['widget.pmxExpireDate'],

    name: 'expire',
    fieldLabel: gettext('Expire'),
    emptyText: 'never',
    format: 'Y-m-d',
    submitFormat: 'U',

    getSubmitValue: function () {
        let me = this;

        let value = me.callParent();
        if (!value) {
            value = 0;
        }

        return value;
    },

    setValue: function (value) {
        let me = this;

        if (Ext.isDefined(value)) {
            if (!value) {
                value = null;
            } else if (!Ext.isDate(value)) {
                value = new Date(value * 1000);
            }
        }
        me.callParent([value]);
    },
});
Ext.define('Proxmox.form.field.Integer', {
    extend: 'Ext.form.field.Number',
    alias: 'widget.proxmoxintegerfield',

    config: {
        deleteEmpty: false,
    },

    allowDecimals: false,
    allowExponential: false,
    step: 1,

    getSubmitData: function () {
        let me = this;
        let data = null;
        if (!me.disabled && me.submitValue && !me.isFileUpload()) {
            let val = me.getSubmitValue();
            if (val !== undefined && val !== null && val !== '') {
                data = {};
                data[me.getName()] = val;
            } else if (me.getDeleteEmpty()) {
                data = {};
                data.delete = me.getName();
            }
        }
        return data;
    },
});
Ext.define('Proxmox.form.field.Textfield', {
    extend: 'Ext.form.field.Text',
    alias: ['widget.proxmoxtextfield'],

    config: {
        skipEmptyText: true,

        deleteEmpty: false,

        trimValue: false,
    },

    getSubmitData: function () {
        let me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue && !me.isFileUpload()) {
            val = me.getSubmitValue();
            if (val !== null) {
                data = {};
                data[me.getName()] = val;
            } else if (me.getDeleteEmpty()) {
                data = {};
                data.delete = me.getName();
            }
        }
        return data;
    },

    getSubmitValue: function () {
        let me = this;

        let value = this.processRawValue(this.getRawValue());
        if (me.getTrimValue() && typeof value === 'string') {
            value = value.trim();
        }
        if (value !== '') {
            return value;
        }

        return me.getSkipEmptyText() ? null : value;
    },

    setAllowBlank: function (allowBlank) {
        this.allowBlank = allowBlank;
        this.validate();
    },
});
Ext.define('Proxmox.form.field.Base64TextArea', {
    extend: 'Ext.form.field.TextArea',
    alias: ['widget.proxmoxBase64TextArea'],

    config: {
        skipEmptyText: false,
        deleteEmpty: false,
        trimValue: false,
        editable: true,
        width: 600,
        height: 400,
        scrollable: 'y',
        emptyText: gettext('You can use Markdown for rich text formatting.'),
    },

    setValue: function (value) {
        // We want to edit the decoded version of the text
        this.callParent([Proxmox.Utils.base64ToUtf8(value)]);
    },

    processRawValue: function (value) {
        // The field could contain multi-line values
        return Proxmox.Utils.utf8ToBase64(value);
    },

    getSubmitData: function () {
        let me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue && !me.isFileUpload()) {
            val = me.getSubmitValue();
            if (val !== null) {
                data = {};
                data[me.getName()] = val;
            } else if (me.getDeleteEmpty()) {
                data = {};
                data.delete = me.getName();
            }
        }
        return data;
    },

    getSubmitValue: function () {
        let me = this;

        let value = this.processRawValue(this.getRawValue());
        if (me.getTrimValue() && typeof value === 'string') {
            value = value.trim();
        }
        if (value !== '') {
            return value;
        }

        return me.getSkipEmptyText() ? null : value;
    },

    setAllowBlank: function (allowBlank) {
        this.allowBlank = allowBlank;
        this.validate();
    },
});
Ext.define('Proxmox.form.field.VlanField', {
    extend: 'Ext.form.field.Number',
    alias: ['widget.proxmoxvlanfield'],

    deleteEmpty: false,

    emptyText: gettext('no VLAN'),

    fieldLabel: gettext('VLAN Tag'),

    allowBlank: true,

    getSubmitData: function () {
        var me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue) {
            val = me.getSubmitValue();
            if (val) {
                data = {};
                data[me.getName()] = val;
            } else if (me.deleteEmpty) {
                data = {};
                data.delete = me.getName();
            }
        }
        return data;
    },

    initComponent: function () {
        var me = this;

        Ext.apply(me, {
            minValue: 1,
            maxValue: 4094,
        });

        me.callParent();
    },
});
Ext.define('Proxmox.DateTimeField', {
    extend: 'Ext.form.FieldContainer',
    // FIXME: remove once all use sites upgraded (with versioned depends on new WTK!)
    alias: ['widget.promxoxDateTimeField'],
    xtype: 'proxmoxDateTimeField',

    layout: 'hbox',

    viewModel: {
        data: {
            datetime: null,
            minDatetime: null,
            maxDatetime: null,
        },

        formulas: {
            date: {
                get: function (get) {
                    return get('datetime');
                },
                set: function (date) {
                    if (!date) {
                        this.set('datetime', null);
                        return;
                    }
                    let datetime = new Date(this.get('datetime'));
                    datetime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                    this.set('datetime', datetime);
                },
            },

            time: {
                get: function (get) {
                    return get('datetime');
                },
                set: function (time) {
                    if (!time) {
                        this.set('datetime', null);
                        return;
                    }
                    let datetime = new Date(this.get('datetime'));
                    datetime.setHours(time.getHours());
                    datetime.setMinutes(time.getMinutes());
                    datetime.setSeconds(time.getSeconds());
                    datetime.setMilliseconds(time.getMilliseconds());
                    this.set('datetime', datetime);
                },
            },

            minDate: {
                get: function (get) {
                    let datetime = get('minDatetime');
                    return datetime ? new Date(datetime) : null;
                },
            },

            maxDate: {
                get: function (get) {
                    let datetime = get('maxDatetime');
                    return datetime ? new Date(datetime) : null;
                },
            },

            minTime: {
                get: function (get) {
                    let current = get('datetime');
                    let min = get('minDatetime');
                    if (min && current && !this.isSameDay(current, min)) {
                        return new Date(min).setHours('00', '00', '00', '000');
                    }
                    return min;
                },
            },

            maxTime: {
                get: function (get) {
                    let current = get('datetime');
                    let max = get('maxDatetime');
                    if (max && current && !this.isSameDay(current, max)) {
                        return new Date(max).setHours('23', '59', '59', '999');
                    }
                    return max;
                },
            },
        },

        // Helper function to check if dates are the same day of the year
        isSameDay: function (date1, date2) {
            return (
                date1.getDate() === date2.getDate() &&
                date1.getMonth() === date2.getMonth() &&
                date1.getFullYear() === date2.getFullYear()
            );
        },
    },

    config: {
        value: null,
        submitFormat: 'U',
        disabled: false,
    },

    setValue: function (value) {
        this.getViewModel().set('datetime', value);
    },

    getValue: function () {
        return this.getViewModel().get('datetime');
    },

    getSubmitValue: function () {
        let me = this;
        let value = me.getValue();
        return value ? Ext.Date.format(value, me.submitFormat) : null;
    },

    setMinValue: function (value) {
        this.getViewModel().set('minDatetime', value);
    },

    getMinValue: function () {
        return this.getViewModel().get('minDatetime');
    },

    setMaxValue: function (value) {
        this.getViewModel().set('maxDatetime', value);
    },

    getMaxValue: function () {
        return this.getViewModel().get('maxDatetime');
    },

    initComponent: function () {
        let me = this;
        me.callParent();

        let vm = me.getViewModel();
        vm.set('datetime', me.config.value);
        // Propagate state change to binding
        vm.bind('{datetime}', function (value) {
            me.publishState('value', value);
            me.fireEvent('change', value);
        });
    },

    items: [
        {
            xtype: 'datefield',
            editable: false,
            flex: 1,
            format: 'Y-m-d',
            bind: {
                value: '{date}',
                minValue: '{minDate}',
                maxValue: '{maxDate}',
            },
        },
        {
            xtype: 'timefield',
            format: 'H:i',
            width: 80,
            value: '00:00',
            increment: 60,
            bind: {
                value: '{time}',
                minValue: '{minTime}',
                maxValue: '{maxTime}',
            },
        },
    ],
});
Ext.define('Proxmox.form.Checkbox', {
    extend: 'Ext.form.field.Checkbox',
    alias: ['widget.proxmoxcheckbox'],

    config: {
        defaultValue: undefined,
        deleteDefaultValue: false,
        deleteEmpty: false,
        clearOnDisable: false,
    },

    inputValue: '1',

    getSubmitData: function () {
        let me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue) {
            val = me.getSubmitValue();
            if (val !== null) {
                data = {};
                if (val === me.getDefaultValue() && me.getDeleteDefaultValue()) {
                    data.delete = me.getName();
                } else {
                    data[me.getName()] = val;
                }
            } else if (me.getDeleteEmpty()) {
                data = {};
                data.delete = me.getName();
            }
        }
        return data;
    },

    setDisabled: function (disabled) {
        let me = this;

        // only clear on actual transition
        let toClearValue = me.clearOnDisable && !me.disabled && disabled;

        me.callParent(arguments);

        if (toClearValue) {
            me.setValue(false); // TODO: could support other "reset value" or use originalValue?
        }
    },

    // also accept integer 1 as true
    setRawValue: function (value) {
        let me = this;

        if (value === 1) {
            me.callParent([true]);
        } else {
            me.callParent([value]);
        }
    },
});
/* Key-Value ComboBox
 *
 * config properties:
 * comboItems: an array of Key - Value pairs
 * deleteEmpty: if set to true (default), an empty value received from the
 * comboBox will reset the property to its default value
 */
Ext.define('Proxmox.form.KVComboBox', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.proxmoxKVComboBox',

    config: {
        deleteEmpty: true,
    },

    comboItems: undefined,
    displayField: 'value',
    valueField: 'key',
    queryMode: 'local',

    // override framework function to implement deleteEmpty behaviour
    getSubmitData: function () {
        let me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue) {
            val = me.getSubmitValue();
            if (val !== null && val !== '' && val !== '__default__') {
                data = {};
                data[me.getName()] = val;
            } else if (me.getDeleteEmpty()) {
                data = {};
                data.delete = me.getName();
            }
        }
        return data;
    },

    validator: function (val) {
        let me = this;

        if (me.editable || val === null || val === '') {
            return true;
        }

        if (me.store.getCount() > 0) {
            let values = me.multiSelect ? val.split(me.delimiter) : [val];
            let items = me.store.getData().collect('value', 'data');
            if (
                Ext.Array.every(values, function (value) {
                    return Ext.Array.contains(items, value);
                })
            ) {
                return true;
            }
        }

        // returns a boolean or string
        return "value '" + val + "' not allowed!";
    },

    initComponent: function () {
        let me = this;

        me.store = Ext.create('Ext.data.ArrayStore', {
            model: 'KeyValue',
            data: me.comboItems,
        });

        if (me.initialConfig.editable === undefined) {
            me.editable = false;
        }

        me.callParent();
    },

    setComboItems: function (items) {
        let me = this;

        me.getStore().setData(items);
    },
});
Ext.define('Proxmox.form.LanguageSelector', {
    extend: 'Proxmox.form.KVComboBox',
    xtype: 'proxmoxLanguageSelector',

    comboItems: Proxmox.Utils.language_array(),

    matchFieldWidth: false,
    listConfig: {
        width: 300,
    },
});
/*
 * ComboGrid component: a ComboBox where the dropdown menu (the
 * "Picker") is a Grid with Rows and Columns expects a listConfig
 * object with a columns property roughly based on the GridPicker from
 * https://www.sencha.com/forum/showthread.php?299909
 *
 */

Ext.define('Proxmox.form.ComboGrid', {
    extend: 'Ext.form.field.ComboBox',
    alias: ['widget.proxmoxComboGrid'],

    // this value is used as default value after load()
    preferredValue: undefined,

    // hack: allow to select empty value
    // seems extjs does not allow that when 'editable == false'
    onKeyUp: function (e, t) {
        let me = this;
        let key = e.getKey();

        if (
            !me.editable &&
            me.allowBlank &&
            !me.multiSelect &&
            (key === e.BACKSPACE || key === e.DELETE)
        ) {
            me.setValue('');
        }

        me.callParent(arguments);
    },

    config: {
        skipEmptyText: false,
        notFoundIsValid: false,
        deleteEmpty: false,
        errorHeight: 100,
        // NOTE: the trigger will always be shown if allowBlank is true, setting showClearTrigger
        // to false cannot change that
        showClearTrigger: false,
    },

    // needed to trigger onKeyUp etc.
    enableKeyEvents: true,

    editable: false,

    triggers: {
        clear: {
            cls: 'pmx-clear-trigger',
            weight: -1,
            hidden: true,
            handler: function () {
                let me = this;
                me.setValue('');
            },
        },
    },

    setValue: function (value) {
        let me = this;
        let empty = Ext.isArray(value) ? !value.length : !value;
        me.triggers.clear.setVisible(!empty && (me.allowBlank || me.showClearTrigger));
        return me.callParent([value]);
    },

    // override ExtJS method
    // if the field has multiSelect enabled, the store is not loaded, and
    // the displayfield == valuefield, it saves the rawvalue as an array
    // but the getRawValue method is only defined in the textfield class
    // (which has not to deal with arrays) an returns the string in the
    // field (not an array)
    //
    // so if we have multiselect enabled, return the rawValue (which
    // should be an array) and else we do callParent so
    // it should not impact any other use of the class
    getRawValue: function () {
        let me = this;
        if (me.multiSelect) {
            return me.rawValue;
        } else {
            return me.callParent();
        }
    },

    getSubmitData: function () {
        let me = this;

        let data = null;
        if (!me.disabled && me.submitValue) {
            let val = me.getSubmitValue();
            if (val !== null) {
                data = {};
                data[me.getName()] = val;
            } else if (me.getDeleteEmpty()) {
                data = {};
                data.delete = me.getName();
            }
        }
        return data;
    },

    getSubmitValue: function () {
        let me = this;

        let value = me.callParent();
        if (value !== '') {
            return value;
        }

        return me.getSkipEmptyText() ? null : value;
    },

    setAllowBlank: function (allowBlank) {
        this.allowBlank = allowBlank;
        this.validate();
    },

    // override ExtJS protected method
    onBindStore: function (store, initial) {
        let me = this,
            picker = me.picker,
            extraKeySpec,
            valueCollectionConfig;

        // We're being bound, not unbound...
        if (store) {
            // If store was created from a 2 dimensional array with generated field names 'field1' and 'field2'
            if (store.autoCreated) {
                me.queryMode = 'local';
                me.valueField = me.displayField = 'field1';
                if (!store.expanded) {
                    me.displayField = 'field2';
                }

                // displayTpl config will need regenerating with the autogenerated displayField name 'field1'
                me.setDisplayTpl(null);
            }
            if (!Ext.isDefined(me.valueField)) {
                me.valueField = me.displayField;
            }

            // Add a byValue index to the store so that we can efficiently look up records by the value field
            // when setValue passes string value(s).
            // The two indices (Ext.util.CollectionKeys) are configured unique: false, so that if duplicate keys
            // are found, they are all returned by the get call.
            // This is so that findByText and findByValue are able to return the *FIRST* matching value. By default,
            // if unique is true, CollectionKey keeps the *last* matching value.
            extraKeySpec = {
                byValue: {
                    rootProperty: 'data',
                    unique: false,
                },
            };
            extraKeySpec.byValue.property = me.valueField;
            store.setExtraKeys(extraKeySpec);

            if (me.displayField === me.valueField) {
                store.byText = store.byValue;
            } else {
                extraKeySpec.byText = {
                    rootProperty: 'data',
                    unique: false,
                };
                extraKeySpec.byText.property = me.displayField;
                store.setExtraKeys(extraKeySpec);
            }

            // We hold a collection of the values which have been selected, keyed by this field's valueField.
            // This collection also functions as the selected items collection for the BoundList's selection model
            valueCollectionConfig = {
                rootProperty: 'data',
                extraKeys: {
                    byInternalId: {
                        property: 'internalId',
                    },
                    byValue: {
                        property: me.valueField,
                        rootProperty: 'data',
                    },
                },
                // Whenever this collection is changed by anyone, whether by this field adding to it,
                // or the BoundList operating, we must refresh our value.
                listeners: {
                    beginupdate: me.onValueCollectionBeginUpdate,
                    endupdate: me.onValueCollectionEndUpdate,
                    scope: me,
                },
            };

            // This becomes our collection of selected records for the Field.
            me.valueCollection = new Ext.util.Collection(valueCollectionConfig);

            // We use the selected Collection as our value collection and the basis
            // for rendering the tag list.

            //proxmox override: since the picker is represented by a grid panel,
            // we changed here the selection to RowModel
            me.pickerSelectionModel = new Ext.selection.RowModel({
                mode: me.multiSelect ? 'SIMPLE' : 'SINGLE',
                // There are situations when a row is selected on mousedown but then the mouse is
                // dragged to another row and released.  In these situations, the event target for
                // the click event won't be the row where the mouse was released but the boundview.
                // The view will then determine that it should fire a container click, and the
                // DataViewModel will then deselect all prior selections. Setting
                // `deselectOnContainerClick` here will prevent the model from deselecting.
                deselectOnContainerClick: false,
                enableInitialSelection: false,
                pruneRemoved: false,
                selected: me.valueCollection,
                store: store,
                listeners: {
                    scope: me,
                    lastselectedchanged: me.updateBindSelection,
                },
            });

            if (!initial) {
                me.resetToDefault();
            }

            if (picker) {
                picker.setSelectionModel(me.pickerSelectionModel);
                if (picker.getStore() !== store) {
                    picker.bindStore(store);
                }
            }
        }
    },

    // copied from ComboBox
    createPicker: function () {
        let me = this;
        let picker;

        let pickerCfg = Ext.apply(
            {
                // proxmox overrides: display a grid for selection
                xtype: 'gridpanel',
                id: me.pickerId,
                pickerField: me,
                floating: true,
                hidden: true,
                store: me.store,
                displayField: me.displayField,
                preserveScrollOnRefresh: true,
                pageSize: me.pageSize,
                tpl: me.tpl,
                selModel: me.pickerSelectionModel,
                focusOnToFront: false,
            },
            me.listConfig,
            me.defaultListConfig,
        );

        picker = me.picker || Ext.widget(pickerCfg);

        if (picker.getStore() !== me.store) {
            picker.bindStore(me.store);
        }

        if (me.pageSize) {
            picker.pagingToolbar.on('beforechange', me.onPageChange, me);
        }

        // proxmox overrides: pass missing method in gridPanel to its view
        picker.refresh = function () {
            picker.getSelectionModel().select(me.valueCollection.getRange());
            picker.getView().refresh();
        };
        picker.getNodeByRecord = function () {
            picker.getView().getNodeByRecord(arguments);
        };

        // We limit the height of the picker to fit in the space above
        // or below this field unless the picker has its own ideas about that.
        if (!picker.initialConfig.maxHeight) {
            picker.on({
                beforeshow: me.onBeforePickerShow,
                scope: me,
            });
        }
        picker.getSelectionModel().on({
            beforeselect: me.onBeforeSelect,
            beforedeselect: me.onBeforeDeselect,
            focuschange: me.onFocusChange,
            selectionChange: function (sm, selectedRecords) {
                if (selectedRecords.length) {
                    this.setValue(selectedRecords);
                    this.fireEvent('select', me, selectedRecords);
                }
            },
            scope: me,
        });

        // hack for extjs6
        // when the clicked item is the same as the previously selected,
        // it does not select the item
        // instead we hide the picker
        if (!me.multiSelect) {
            picker.on('itemclick', function (sm, record) {
                if (picker.getSelection()[0] === record) {
                    me.collapse();
                }
            });
        }

        // when our store is not yet loaded, we increase
        // the height of the gridpanel, so that we can see
        // the loading mask
        //
        // we save the minheight to reset it after the load
        picker.on('show', function () {
            me.store.fireEvent('refresh');
            if (me.enableLoadMask) {
                me.savedMinHeight = me.savedMinHeight ?? picker.getMinHeight();
                picker.setMinHeight(me.errorHeight);
            }
            if (me.loadError) {
                Proxmox.Utils.setErrorMask(picker.getView(), me.loadError);
                delete me.loadError;
                picker.updateLayout();
            }
        });

        picker.getNavigationModel().navigateOnSpace = false;

        return picker;
    },

    clearLocalFilter: function () {
        let me = this;

        if (me.queryFilter) {
            me.changingFilters = true; // FIXME: unused?
            me.store.removeFilter(me.queryFilter, true);
            me.queryFilter = null;
            me.changingFilters = false;
        }
    },

    isValueInStore: function (value) {
        let me = this;
        let store = me.store;
        let found = false;

        if (!store) {
            return found;
        }

        // Make sure the current filter is removed before checking the store
        // to prevent false negative results when iterating over a filtered store.
        // All store.find*() method's operate on the filtered store.
        if (me.queryFilter && me.queryMode === 'local' && me.clearFilterOnBlur) {
            me.clearLocalFilter();
        }

        if (Ext.isArray(value)) {
            Ext.Array.each(value, function (v) {
                if (store.findRecord(me.valueField, v, 0, false, true, true)) {
                    found = true;
                    return false; // break
                }
                return true;
            });
        } else {
            found = !!store.findRecord(me.valueField, value, 0, false, true, true);
        }

        return found;
    },

    validator: function (value) {
        let me = this;

        if (!value) {
            return true; // handled later by allowEmpty in the getErrors call chain
        }

        // we normally get here the displayField as value, but if a valueField
        // is configured we need to get the "actual" value, to ensure it is in
        // the store. Below check is copied from ExtJS 6.0.2 ComboBox source
        //
        // we also have to get the 'real' value if the we have a mulitSelect
        // Field but got a non array value
        if (
            (me.valueField && me.valueField !== me.displayField) ||
            (me.multiSelect && !Ext.isArray(value))
        ) {
            value = me.getValue();
        }

        if (!(me.notFoundIsValid || me.isValueInStore(value))) {
            return gettext('Invalid Value');
        }

        return true;
    },

    // validate after enabling a field, otherwise blank fields with !allowBlank
    // are sometimes not marked as invalid
    setDisabled: function (value) {
        this.callParent([value]);
        this.validate();
    },

    initComponent: function () {
        let me = this;

        Ext.apply(me, {
            queryMode: 'local',
            matchFieldWidth: false,
        });

        Ext.applyIf(me, { value: [] }); // hack: avoid ExtJS validate() bug

        Ext.applyIf(me.listConfig, { width: 400 });

        me.callParent();

        // Create the picker at an early stage, so it is available to store the previous selection
        if (!me.picker) {
            me.getPicker();
        }

        me.mon(me.store, 'beforeload', function () {
            if (!me.isDisabled()) {
                me.enableLoadMask = true;
            }
        });

        // hack: autoSelect does not work
        me.mon(me.store, 'load', function (store, r, success, o) {
            if (success) {
                me.clearInvalid();
                delete me.loadError;

                if (me.enableLoadMask) {
                    delete me.enableLoadMask;

                    // if the picker exists, we reset its minHeight to the previous saved one or 0
                    if (me.picker) {
                        me.picker.setMinHeight(me.savedMinHeight || 0);
                        Proxmox.Utils.setErrorMask(me.picker.getView());
                        delete me.savedMinHeight;
                        // we have to update the layout, otherwise the height gets not recalculated
                        me.picker.updateLayout();
                    }
                }

                let def = me.getValue() || me.preferredValue;
                if (def) {
                    me.setValue(def, true); // sync with grid
                }
                let found = false;
                if (def) {
                    found = me.isValueInStore(def);
                }

                if (!found) {
                    if (!(Ext.isArray(def) ? def.length : def)) {
                        let rec = me.store.first();
                        if (me.autoSelect && rec && rec.data) {
                            def = rec.data[me.valueField];
                            me.setValue(def, true);
                        } else if (!me.allowBlank) {
                            me.setValue(def);
                            if (!me.isDisabled()) {
                                me.markInvalid(me.blankText);
                            }
                        }
                    } else if (!me.notFoundIsValid && !me.isDisabled()) {
                        me.markInvalid(gettext('Invalid Value'));
                    }
                }
            } else {
                let msg = Proxmox.Utils.getResponseErrorMessage(o.getError());
                if (me.picker) {
                    me.savedMinHeight = me.savedMinHeight ?? me.picker.getMinHeight();
                    me.picker.setMinHeight(me.errorHeight);
                    Proxmox.Utils.setErrorMask(me.picker.getView(), msg);
                    me.picker.updateLayout();
                }
                me.loadError = msg;
            }
        });
    },
});
Ext.define('Proxmox.form.RRDTypeSelector', {
    extend: 'Ext.form.FieldContainer',
    alias: ['widget.proxmoxRRDTypeSelector'],

    stateful: true,
    stateId: 'proxmoxRRDTypeSelection',
    layout: 'hbox',

    referenceHolder: true,

    // save current selection in the state Provider so RRDView can read it
    getState: function () {
        let me = this;
        let timeframe = me.lookup('timeframe').getValue();
        let max = me.lookup('maximum').pressed;
        let id = timeframe;
        if (max) {
            id += 'max';
        }

        return {
            id,
            timeframe,
            cf: max ? 'MAX' : 'AVERAGE',
        };
    },
    // set selection based on last saved state
    applyState: function (state) {
        if (state && state.id) {
            this.setValue(state.id);
        }
    },

    setValue: function (value) {
        let me = this;
        let timeframe = value;
        let max = value.endsWith('max');
        if (max) {
            timeframe = value.substring(0, value.length - 3);
        }

        me.lookup('timeframe').setValue(timeframe);
        me.lookup(max ? 'maximum' : 'average').setPressed(true);
        me.lookup(!max ? 'maximum' : 'average').setPressed(false);
    },

    items: [
        {
            xtype: 'combobox',
            reference: 'timeframe',
            padding: '0 5 0 0',
            displayField: 'text',
            valueField: 'id',
            editable: false,
            queryMode: 'local',
            value: 'hour',
            store: {
                type: 'array',
                fields: ['id', 'text'],
                data: [
                    ['hour', gettext('Hour')],
                    ['day', gettext('Day')],
                    ['week', gettext('Week')],
                    ['month', gettext('Month')],
                    ['year', gettext('Year')],
                ],
            },
            listeners: {
                change: function () {
                    this.up('proxmoxRRDTypeSelector').saveState();
                },
            },
        },
        {
            xtype: 'segmentedbutton',
            allowMultiple: false,
            allowToggle: true,
            itemCls: 'x-btn-default-toolbar-small proxmox-inline-button',
            items: [
                {
                    text: gettext('Maximum'),
                    reference: 'maximum',
                    style: {
                        'border-top-right-radius': '0px',
                        'border-bottom-right-radius': '0px',
                        'border-right-width': '0px',
                    },
                    handler: function () {
                        this.up('proxmoxRRDTypeSelector').saveState();
                    },
                },
                {
                    text: gettext('Average'),
                    reference: 'average',
                    pressed: true,
                    style: {
                        'border-top-left-radius': '0px',
                        'border-bottom-left-radius': '0px',
                        'border-left-width': '0px',
                    },
                    handler: function () {
                        this.up('proxmoxRRDTypeSelector').saveState();
                    },
                },
            ],
        },
    ],
});
Ext.define('Proxmox.form.BondModeSelector', {
    extend: 'Proxmox.form.KVComboBox',
    alias: ['widget.bondModeSelector'],

    openvswitch: false,

    initComponent: function () {
        let me = this;

        if (me.openvswitch) {
            me.comboItems = Proxmox.Utils.bond_mode_array([
                'active-backup',
                'balance-slb',
                'lacp-balance-slb',
                'lacp-balance-tcp',
            ]);
        } else {
            me.comboItems = Proxmox.Utils.bond_mode_array([
                'balance-rr',
                'active-backup',
                'balance-xor',
                'broadcast',
                '802.3ad',
                'balance-tlb',
                'balance-alb',
            ]);
        }

        me.callParent();
    },
});

Ext.define('Proxmox.form.BondPolicySelector', {
    extend: 'Proxmox.form.KVComboBox',
    alias: ['widget.bondPolicySelector'],
    comboItems: [
        ['layer2', 'layer2'],
        ['layer2+3', 'layer2+3'],
        ['layer3+4', 'layer3+4'],
    ],
});
Ext.define('Proxmox.form.NetworkSelectorController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.proxmoxNetworkSelectorController',

    init: function (view) {
        let _me = this;

        if (!view.nodename) {
            throw 'missing custom view config: nodename';
        }
        view.getStore()
            .getProxy()
            .setUrl(`/api2/json/nodes/${view.nodename}/network${view.getQueryString()}`);
    },
});

Ext.define('Proxmox.data.NetworkSelector', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'active' },
        { name: 'cidr' },
        { name: 'cidr6' },
        { name: 'address' },
        { name: 'address6' },
        { name: 'comments' },
        { name: 'iface' },
        { name: 'slaves' },
        { name: 'type' },
    ],
});

Ext.define('Proxmox.form.NetworkSelector', {
    extend: 'Proxmox.form.ComboGrid',
    alias: 'widget.proxmoxNetworkSelector',

    controller: 'proxmoxNetworkSelectorController',

    type: undefined,
    getQueryString: function () {
        return this.type ? `?type=${this.type}` : '';
    },

    nodename: 'localhost',
    setNodename: function (nodename) {
        this.nodename = nodename;
        let networkSelectorStore = this.getStore();
        networkSelectorStore.removeAll();
        // because of manual local copy of data for ip4/6
        this.getPicker().refresh();
        if (networkSelectorStore && typeof networkSelectorStore.getProxy === 'function') {
            networkSelectorStore
                .getProxy()
                .setUrl(`/api2/json/nodes/${nodename}/network${this.getQueryString()}`);
            networkSelectorStore.load();
        }
    },
    valueField: 'cidr',
    displayField: 'cidr',
    store: {
        autoLoad: true,
        model: 'Proxmox.data.NetworkSelector',
        proxy: {
            type: 'proxmox',
        },
        sorters: [
            {
                property: 'iface',
                direction: 'ASC',
            },
        ],
        filters: [
            function (item) {
                return item.data.cidr;
            },
        ],
        listeners: {
            load: function (store, records, successful) {
                if (successful) {
                    records.forEach(function (record) {
                        if (record.data.cidr6) {
                            let dest = record.data.cidr ? record.copy(null) : record;
                            dest.data.cidr = record.data.cidr6;
                            dest.data.address = record.data.address6;
                            delete record.data.cidr6;
                            dest.data.comments = record.data.comments6;
                            delete record.data.comments6;
                            store.add(dest);
                        }
                    });
                }
            },
        },
    },
    listConfig: {
        width: 600,
        columns: [
            {
                header: gettext('CIDR'),
                dataIndex: 'cidr',
                hideable: false,
                flex: 1,
            },
            {
                header: gettext('IP'),
                dataIndex: 'address',
                hidden: true,
            },
            {
                header: gettext('Interface'),
                width: 90,
                dataIndex: 'iface',
            },
            {
                header: gettext('Active'),
                renderer: Proxmox.Utils.format_boolean,
                width: 60,
                dataIndex: 'active',
            },
            {
                header: gettext('Type'),
                width: 80,
                hidden: true,
                dataIndex: 'type',
            },
            {
                header: gettext('Comment'),
                flex: 2,
                dataIndex: 'comments',
                renderer: Ext.String.htmlEncode,
            },
        ],
    },
});
Ext.define('Proxmox.form.RealmComboBox', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.pmxRealmComboBox',

    controller: {
        xclass: 'Ext.app.ViewController',

        init: function (view) {
            let store = view.getStore();
            store.proxy.url = `/api2/json${view.baseUrl}`;
            if (view.storeFilter) {
                store.setFilters(view.storeFilter);
            }
            store.on('load', this.onLoad, view);
            store.load();
        },

        onLoad: function (store, records, success) {
            if (!success) {
                return;
            }
            let me = this;
            let val = me.getValue();
            if (!val || !me.store.findRecord('realm', val, 0, false, true, true)) {
                let def = 'pam';
                Ext.each(records, function (rec) {
                    if (rec.data && rec.data.default) {
                        def = rec.data.realm;
                    }
                });
                me.setValue(def);
            }
        },
    },

    // define custom filters for the underlying store
    storeFilter: undefined,

    fieldLabel: gettext('Realm'),
    name: 'realm',
    queryMode: 'local',
    allowBlank: false,
    editable: false,
    forceSelection: true,
    autoSelect: false,
    triggerAction: 'all',
    valueField: 'realm',
    displayField: 'descr',
    baseUrl: '/access/domains',
    getState: function () {
        return { value: this.getValue() };
    },
    applyState: function (state) {
        if (state && state.value) {
            this.setValue(state.value);
        }
    },
    stateEvents: ['select'],
    stateful: true, // last chosen auth realm is saved between page reloads
    id: 'pveloginrealm', // We need stable ids when using stateful, not autogenerated
    stateID: 'pveloginrealm',

    store: {
        model: 'pmx-domains',
        autoLoad: false,
    },
});
Ext.define('Proxmox.form.field.PruneKeep', {
    extend: 'Proxmox.form.field.Integer',
    xtype: 'pmxPruneKeepField',

    allowBlank: true,
    minValue: 1,

    listeners: {
        dirtychange: (field, dirty) => field.triggers.clear.setVisible(dirty),
    },
    triggers: {
        clear: {
            cls: 'pmx-clear-trigger',
            weight: -1,
            hidden: true,
            handler: function () {
                this.triggers.clear.setVisible(false);
                this.setValue(this.originalValue);
            },
        },
    },
});
Ext.define('pmx-roles', {
    extend: 'Ext.data.Model',
    fields: ['roleid', 'privs'],
    proxy: {
        type: 'proxmox',
        url: '/api2/json/access/roles',
    },
    idProperty: 'roleid',
});

Ext.define('Proxmox.form.RoleSelector', {
    extend: 'Proxmox.form.ComboGrid',
    alias: 'widget.pmxRoleSelector',

    allowBlank: false,
    autoSelect: false,
    valueField: 'roleid',
    displayField: 'roleid',

    listConfig: {
        width: 560,
        resizable: true,
        columns: [
            {
                header: gettext('Role'),
                sortable: true,
                dataIndex: 'roleid',
                flex: 2,
            },
            {
                header: gettext('Privileges'),
                dataIndex: 'privs',
                cellWrap: true,
                // join manually here, as ExtJS joins without whitespace which breaks cellWrap
                renderer: (v) => (Ext.isArray(v) ? v.join(', ') : v.replaceAll(',', ', ')),
                flex: 5,
            },
        ],
    },

    store: {
        autoLoad: true,
        model: 'pmx-roles',
        sorters: 'roleid',
    },
});
Ext.define('Proxmox.form.DiskSelector', {
    extend: 'Proxmox.form.ComboGrid',
    xtype: 'pmxDiskSelector',

    // can be
    // undefined: all
    // unused: only unused
    // journal_disk: all disks with gpt
    diskType: undefined,

    // use include-partitions=1 as a parameter
    includePartitions: false,

    // the property the backend wants for the type ('type' by default)
    typeProperty: 'type',

    valueField: 'devpath',
    displayField: 'devpath',
    emptyText: gettext('No Disks unused'),
    listConfig: {
        width: 600,
        columns: [
            {
                header: gettext('Device'),
                flex: 3,
                sortable: true,
                dataIndex: 'devpath',
            },
            {
                header: gettext('Size'),
                flex: 2,
                sortable: false,
                renderer: Proxmox.Utils.format_size,
                dataIndex: 'size',
            },
            {
                header: gettext('Serial'),
                flex: 5,
                sortable: true,
                dataIndex: 'serial',
            },
        ],
    },

    initComponent: function () {
        var me = this;

        var nodename = me.nodename;
        if (!nodename) {
            throw 'no node name specified';
        }

        let extraParams = {};

        if (me.diskType) {
            extraParams[me.typeProperty] = me.diskType;
        }

        if (me.includePartitions) {
            extraParams['include-partitions'] = 1;
        }

        var store = Ext.create('Ext.data.Store', {
            filterOnLoad: true,
            model: 'pmx-disk-list',
            proxy: {
                type: 'proxmox',
                url: `/api2/json/nodes/${nodename}/disks/list`,
                extraParams,
            },
            sorters: [
                {
                    property: 'devpath',
                    direction: 'ASC',
                },
            ],
        });

        Ext.apply(me, {
            store: store,
        });

        me.callParent();

        store.load();
    },
});
Ext.define('Proxmox.form.MultiDiskSelector', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.pmxMultiDiskSelector',

    mixins: {
        field: 'Ext.form.field.Field',
    },

    selModel: 'checkboxmodel',

    store: {
        data: [],
        proxy: {
            type: 'proxmox',
        },
    },

    // which field of the disklist is used for getValue
    valueField: 'devpath',

    // which parameter is used for the type
    typeParameter: 'type',

    // the type of disks to show
    diskType: 'unused',

    // add include-partitions=1 as a request parameter
    includePartitions: false,

    disks: [],

    allowBlank: false,

    getValue: function () {
        let me = this;
        return me.disks;
    },

    setValue: function (value) {
        let me = this;

        value ??= [];

        if (!Ext.isArray(value)) {
            value = value.split(/;, /);
        }

        let store = me.getStore();
        let selection = [];

        let keyField = me.valueField;

        value.forEach((item) => {
            let rec = store.findRecord(keyField, item, 0, false, true, true);
            if (rec) {
                selection.push(rec);
            }
        });

        me.setSelection(selection);

        return me.mixins.field.setValue.call(me, value);
    },

    getErrors: function (value) {
        let me = this;
        if (me.allowBlank === false && me.getSelectionModel().getCount() === 0) {
            me.addBodyCls(['x-form-trigger-wrap-default', 'x-form-trigger-wrap-invalid']);
            return [gettext('No Disk selected')];
        }

        me.removeBodyCls(['x-form-trigger-wrap-default', 'x-form-trigger-wrap-invalid']);
        return [];
    },

    update_disklist: function () {
        var me = this;
        var disks = me.getSelection();

        var val = [];
        disks.sort(function (a, b) {
            var aorder = a.get('order') || 0;
            var border = b.get('order') || 0;
            return aorder - border;
        });

        disks.forEach(function (disk) {
            val.push(disk.get(me.valueField));
        });

        me.validate();
        me.disks = val;
    },

    columns: [
        {
            text: gettext('Device'),
            dataIndex: 'devpath',
            flex: 2,
        },
        {
            text: gettext('Model'),
            dataIndex: 'model',
            flex: 2,
        },
        {
            text: gettext('Serial'),
            dataIndex: 'serial',
            flex: 2,
        },
        {
            text: gettext('Size'),
            dataIndex: 'size',
            renderer: Proxmox.Utils.format_size,
            flex: 1,
        },
        {
            header: gettext('Order'),
            xtype: 'widgetcolumn',
            dataIndex: 'order',
            sortable: true,
            flex: 1,
            widget: {
                xtype: 'proxmoxintegerfield',
                minValue: 1,
                isFormField: false,
                listeners: {
                    change: function (numberfield, value, old_value) {
                        let grid = this.up('pmxMultiDiskSelector');
                        var record = numberfield.getWidgetRecord();
                        record.set('order', value);
                        grid.update_disklist(record);
                    },
                },
            },
        },
    ],

    listeners: {
        selectionchange: function () {
            this.update_disklist();
        },
    },

    initComponent: function () {
        let me = this;

        let extraParams = {};

        if (!me.url) {
            if (!me.nodename) {
                throw 'no url or nodename given';
            }

            me.url = `/api2/json/nodes/${me.nodename}/disks/list`;

            extraParams[me.typeParameter] = me.diskType;

            if (me.includePartitions) {
                extraParams['include-partitions'] = 1;
            }
        }

        me.disks = [];

        me.callParent();
        let store = me.getStore();
        store.setProxy({
            type: 'proxmox',
            url: me.url,
            extraParams,
        });
        store.load();
        store.sort({ property: me.valueField });
    },
});
Ext.define('Proxmox.form.TaskTypeSelector', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.pmxTaskTypeSelector',

    anyMatch: true,

    initComponent: function () {
        let me = this;
        me.store = Object.keys(Proxmox.Utils.task_desc_table).sort();
        me.callParent();
    },
    listeners: {
        change: function (field, newValue, oldValue) {
            if (newValue !== this.originalValue) {
                this.triggers.clear.setVisible(true);
            }
        },
    },
    triggers: {
        clear: {
            cls: 'pmx-clear-trigger',
            weight: -1,
            hidden: true,
            handler: function () {
                this.triggers.clear.setVisible(false);
                this.setValue(this.originalValue);
            },
        },
    },
});
Ext.define('Proxmox.form.ACMEApiSelector', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.pmxACMEApiSelector',

    fieldLabel: gettext('DNS API'),
    displayField: 'name',
    valueField: 'id',

    store: {
        model: 'proxmox-acme-challenges',
        autoLoad: true,
    },

    triggerAction: 'all',
    queryMode: 'local',
    allowBlank: false,
    editable: true,
    forceSelection: true,
    anyMatch: true,
    selectOnFocus: true,

    getSchema: function () {
        let me = this;
        let val = me.getValue();
        if (val) {
            let record = me.getStore().findRecord('id', val, 0, false, true, true);
            if (record) {
                return record.data.schema;
            }
        }
        return {};
    },

    initComponent: function () {
        let me = this;

        if (!me.url) {
            throw 'no url given';
        }

        me.callParent();
        me.getStore().getProxy().setUrl(me.url);
    },
});

Ext.define('Proxmox.form.ACMEAccountSelector', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.pmxACMEAccountSelector',

    displayField: 'name',
    valueField: 'name',

    store: {
        model: 'proxmox-acme-accounts',
        autoLoad: true,
    },

    triggerAction: 'all',
    queryMode: 'local',
    allowBlank: false,
    editable: false,
    forceSelection: true,

    isEmpty: function () {
        return this.getStore().getData().length === 0;
    },

    initComponent: function () {
        let me = this;

        if (!me.url) {
            throw 'no url given';
        }

        me.callParent();
        me.getStore().getProxy().setUrl(me.url);
    },
});

Ext.define('Proxmox.form.ACMEPluginSelector', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.pmxACMEPluginSelector',

    fieldLabel: gettext('Plugin'),
    displayField: 'plugin',
    valueField: 'plugin',

    store: {
        model: 'proxmox-acme-plugins',
        autoLoad: true,
        filters: (item) => item.data.type === 'dns',
    },

    triggerAction: 'all',
    queryMode: 'local',
    allowBlank: false,
    editable: false,

    initComponent: function () {
        let me = this;

        if (!me.url) {
            throw 'no url given';
        }

        me.callParent();
        me.getStore().getProxy().setUrl(me.url);
    },
});
Ext.define('Proxmox.form.UserSelector', {
    extend: 'Proxmox.form.ComboGrid',
    alias: 'widget.pmxUserSelector',

    allowBlank: false,
    autoSelect: false,
    valueField: 'userid',
    displayField: 'userid',

    editable: true,
    anyMatch: true,
    forceSelection: true,

    store: {
        model: 'pmx-users',
        autoLoad: true,
        params: {
            enabled: 1,
        },
        sorters: 'userid',
    },

    listConfig: {
        columns: [
            {
                header: gettext('User'),
                sortable: true,
                dataIndex: 'userid',
                renderer: Ext.String.htmlEncode,
                flex: 1,
            },
            {
                header: gettext('Name'),
                sortable: true,
                renderer: (first, mD, rec) =>
                    Ext.String.htmlEncode(`${first || ''} ${rec.data.lastname || ''}`),
                dataIndex: 'firstname',
                flex: 1,
            },
            {
                header: gettext('Comment'),
                sortable: false,
                dataIndex: 'comment',
                renderer: Ext.String.htmlEncode,
                flex: 1,
            },
        ],
    },
});
Ext.define('Proxmox.form.ThemeSelector', {
    extend: 'Proxmox.form.KVComboBox',
    xtype: 'proxmoxThemeSelector',

    comboItems: Proxmox.Utils.theme_array(),
});
Ext.define('Proxmox.form.field.FingerprintField', {
    extend: 'Proxmox.form.field.Textfield',
    alias: ['widget.pmxFingerprintField'],

    config: {
        fieldLabel: gettext('Fingerprint'),
        emptyText: gettext(
            'Server certificate SHA-256 fingerprint, required for self-signed certificates',
        ),

        regex: /[A-Fa-f0-9]{2}(:[A-Fa-f0-9]{2}){31}/,
        regexText: gettext('Example') + ': AB:CD:EF:...',

        allowBlank: true,
    },
});
/* Button features:
 * - observe selection changes to enable/disable the button using enableFn()
 * - pop up confirmation dialog using confirmMsg()
 */
Ext.define('Proxmox.button.Button', {
    extend: 'Ext.button.Button',
    alias: 'widget.proxmoxButton',

    // the selection model to observe
    selModel: undefined,

    // if 'false' handler will not be called (button disabled)
    enableFn: function (record) {
        // return undefined by default
    },

    // function(record) or text
    confirmMsg: false,

    // take special care in confirm box (select no as default).
    dangerous: false,

    // is used to get the parent container for its selection model
    parentXType: 'grid',

    initComponent: function () {
        let me = this;

        if (me.handler) {
            // Note: me.realHandler may be a string (see named scopes)
            let realHandler = me.handler;

            me.handler = function (button, event) {
                let rec, msg;
                if (me.selModel) {
                    rec = me.selModel.getSelection()[0];
                    if (!rec || me.enableFn(rec) === false) {
                        return;
                    }
                }

                if (me.confirmMsg) {
                    msg = me.confirmMsg;
                    if (Ext.isFunction(me.confirmMsg)) {
                        msg = me.confirmMsg(rec);
                    }
                    Ext.MessageBox.defaultButton = me.dangerous ? 2 : 1;
                    Ext.Msg.show({
                        title: gettext('Confirm'),
                        icon: me.dangerous ? Ext.Msg.WARNING : Ext.Msg.QUESTION,
                        message: msg,
                        buttons: Ext.Msg.YESNO,
                        defaultFocus: me.dangerous ? 'no' : 'yes',
                        callback: function (btn) {
                            if (btn !== 'yes') {
                                return;
                            }
                            Ext.callback(realHandler, me.scope, [button, event, rec], 0, me);
                        },
                    });
                } else {
                    Ext.callback(realHandler, me.scope, [button, event, rec], 0, me);
                }
            };
        }

        me.callParent();

        let grid;
        if (!me.selModel && me.selModel !== null && me.selModel !== false) {
            let parent = me.up(me.parentXType);
            if (parent && parent.selModel) {
                me.selModel = parent.selModel;
            }
        }

        if (me.waitMsgTarget === true) {
            grid = me.up('grid');
            if (grid) {
                me.waitMsgTarget = grid;
            } else {
                throw 'unable to find waitMsgTarget';
            }
        }

        if (me.selModel) {
            me.mon(me.selModel, 'selectionchange', function () {
                let rec = me.selModel.getSelection()[0];
                if (!rec || me.enableFn(rec) === false) {
                    me.setDisabled(true);
                } else {
                    me.setDisabled(false);
                }
            });
        }
    },
});

Ext.define('Proxmox.button.StdRemoveButton', {
    extend: 'Proxmox.button.Button',
    alias: 'widget.proxmoxStdRemoveButton',

    text: gettext('Remove'),

    disabled: true,

    // time to wait for removal task to finish
    delay: undefined,

    config: {
        baseurl: undefined,
        customConfirmationMessage: undefined,
    },

    getUrl: function (rec) {
        let me = this;

        if (me.selModel) {
            return me.baseurl + '/' + rec.getId();
        } else {
            return me.baseurl;
        }
    },

    // also works with names scopes
    callback: function (options, success, response) {
        // do nothing by default
    },

    getRecordName: (rec) => rec.getId(),

    confirmMsg: function (rec) {
        let me = this;

        let name = me.getRecordName(rec);

        let text;
        if (me.customConfirmationMessage) {
            text = me.customConfirmationMessage;
        } else {
            text = gettext('Are you sure you want to remove entry {0}');
        }
        return Ext.String.format(text, Ext.htmlEncode(`'${name}'`));
    },

    handler: function (btn, event, rec) {
        let me = this;

        let url = me.getUrl(rec);

        if (typeof me.delay !== 'undefined' && me.delay >= 0) {
            url += '?delay=' + me.delay;
        }

        Proxmox.Utils.API2Request({
            url: url,
            method: 'DELETE',
            waitMsgTarget: me.waitMsgTarget,
            callback: function (options, success, response) {
                Ext.callback(me.callback, me.scope, [options, success, response], 0, me);
            },
            failure: (response) => Ext.Msg.alert(gettext('Error'), response.htmlStatus),
        });
    },
    initComponent: function () {
        let me = this;

        // enable by default if no seleModel is there and disabled not set
        if (
            me.initialConfig.disabled === undefined &&
            (me.selModel === null || me.selModel === false)
        ) {
            me.disabled = false;
        }

        me.callParent();
    },
});
Ext.define('Proxmox.button.AltText', {
    extend: 'Proxmox.button.Button',
    xtype: 'proxmoxAltTextButton',

    defaultText: '',
    altText: '',

    listeners: {
        // HACK: calculate the max button width on first render to avoid toolbar glitches
        render: function (button) {
            let me = this;

            button.setText(me.altText);
            let altWidth = button.getSize().width;

            button.setText(me.defaultText);
            let defaultWidth = button.getSize().width;

            button.setWidth(defaultWidth > altWidth ? defaultWidth : altWidth);
        },
    },
});
/* help button pointing to an online documentation
   for components contained in a modal window
*/
Ext.define('Proxmox.button.Help', {
    extend: 'Ext.button.Button',
    xtype: 'proxmoxHelpButton',

    text: gettext('Help'),

    // make help button less flashy by styling it like toolbar buttons
    iconCls: ' x-btn-icon-el-default-toolbar-small fa fa-question-circle',
    cls: 'x-btn-default-toolbar-small proxmox-inline-button',

    hidden: true,

    listenToGlobalEvent: true,

    controller: {
        xclass: 'Ext.app.ViewController',
        listen: {
            global: {
                proxmoxShowHelp: 'onProxmoxShowHelp',
                proxmoxHideHelp: 'onProxmoxHideHelp',
            },
        },
        onProxmoxShowHelp: function (helpLink) {
            let view = this.getView();
            if (view.listenToGlobalEvent === true) {
                view.setOnlineHelp(helpLink);
                view.show();
            }
        },
        onProxmoxHideHelp: function () {
            let view = this.getView();
            if (view.listenToGlobalEvent === true) {
                view.hide();
            }
        },
    },

    // this sets the link and the tooltip text
    setOnlineHelp: function (blockid) {
        let me = this;

        let info = Proxmox.Utils.get_help_info(blockid);
        if (info) {
            me.onlineHelp = blockid;
            let title = info.title;
            if (info.subtitle) {
                title += ' - ' + info.subtitle;
            }
            me.setTooltip(title);
        }
    },

    // helper to set the onlineHelp via a config object
    setHelpConfig: function (config) {
        let me = this;
        me.setOnlineHelp(config.onlineHelp);
    },

    handler: function () {
        let me = this;
        let docsURI;

        if (me.onlineHelp) {
            docsURI = Proxmox.Utils.get_help_link(me.onlineHelp);
        }

        if (docsURI) {
            window.open(docsURI);
        } else {
            Ext.Msg.alert(gettext('Help'), gettext('No Help available'));
        }
    },

    initComponent: function () {
        let me = this;

        me.callParent();

        if (me.onlineHelp) {
            me.setOnlineHelp(me.onlineHelp); // set tooltip
        }
    },
});
/** Renders a list of key values objects

Mandatory Config Parameters:

rows: an object container where each property is a key-value object we want to render

  rows: {
     keyboard: {
         header: gettext('Keyboard Layout'),
         editor: 'Your.KeyboardEdit',
         required: true
     },
     // ...
  },

Convenience Helper:

As alternative you can use the common add-row helper like `add_text_row`, but you need to
call it in an overridden initComponent before `me.callParent(arguments)` gets executed.

For a declarative approach you can use the `gridRows` configuration to pass an array of
objects with each having at least a `xtype` to match `add_XTYPE_row` and a field-name
property, for example:

 gridRows: [
    {
      xtype: 'text',
      name: 'http-proxy',
      text: gettext('HTTP proxy'),
      defaultValue: Proxmox.Utils.noneText,
      vtype: 'HttpProxy',
      deleteEmpty: true,
    },
  ],

Optional Configs:

disabled:: setting this parameter to true will disable selection and focus on
  the proxmoxObjectGrid as well as greying out input elements. Useful for a
  readonly tabular display

*/
Ext.define('Proxmox.grid.ObjectGrid', {
    extend: 'Ext.grid.GridPanel',
    alias: ['widget.proxmoxObjectGrid'],

    // can be used as declarative replacement over manually calling the add_XYZ_row helpers,
    // see top-level doc-comment above for details/example
    gridRows: [],

    disabled: false,
    hideHeaders: true,

    monStoreErrors: false,

    add_combobox_row: function (name, text, opts) {
        let me = this;

        opts = opts || {};
        me.rows = me.rows || {};

        me.rows[name] = {
            required: true,
            defaultValue: opts.defaultValue,
            header: text,
            renderer: opts.renderer,
            editor: {
                xtype: 'proxmoxWindowEdit',
                subject: text,
                fieldDefaults: {
                    labelWidth: opts.labelWidth || 100,
                },
                items: {
                    xtype: 'proxmoxKVComboBox',
                    name: name,
                    comboItems: opts.comboItems,
                    value: opts.defaultValue,
                    deleteEmpty: !!opts.deleteEmpty,
                    emptyText: opts.defaultValue,
                    labelWidth: Proxmox.Utils.compute_min_label_width(text, opts.labelWidth),
                    fieldLabel: text,
                },
            },
        };
        if (opts.onlineHelp) {
            me.rows[name].editor.onlineHelp = opts.onlineHelp;
        }
    },

    add_text_row: function (name, text, opts) {
        let me = this;

        opts = opts || {};
        me.rows = me.rows || {};

        me.rows[name] = {
            required: true,
            defaultValue: opts.defaultValue,
            header: text,
            renderer: opts.renderer,
            editor: {
                xtype: 'proxmoxWindowEdit',
                subject: text,
                fieldDefaults: {
                    labelWidth: opts.labelWidth || 100,
                },
                items: {
                    xtype: 'proxmoxtextfield',
                    name: name,
                    deleteEmpty: !!opts.deleteEmpty,
                    emptyText: opts.defaultValue,
                    labelWidth: Proxmox.Utils.compute_min_label_width(text, opts.labelWidth),
                    vtype: opts.vtype,
                    fieldLabel: text,
                },
            },
        };
        if (opts.onlineHelp) {
            me.rows[name].editor.onlineHelp = opts.onlineHelp;
        }
    },

    add_boolean_row: function (name, text, opts) {
        let me = this;

        opts = opts || {};
        me.rows = me.rows || {};

        me.rows[name] = {
            required: true,
            defaultValue: opts.defaultValue || 0,
            header: text,
            renderer: opts.renderer || Proxmox.Utils.format_boolean,
            editor: {
                xtype: 'proxmoxWindowEdit',
                subject: text,
                fieldDefaults: {
                    labelWidth: opts.labelWidth || 100,
                },
                items: {
                    xtype: 'proxmoxcheckbox',
                    name: name,
                    uncheckedValue: 0,
                    defaultValue: opts.defaultValue || 0,
                    checked: !!opts.defaultValue,
                    deleteDefaultValue: !!opts.deleteDefaultValue,
                    labelWidth: Proxmox.Utils.compute_min_label_width(text, opts.labelWidth),
                    fieldLabel: text,
                },
            },
        };
        if (opts.onlineHelp) {
            me.rows[name].editor.onlineHelp = opts.onlineHelp;
        }
    },

    add_integer_row: function (name, text, opts) {
        let me = this;

        opts = opts || {};
        me.rows = me.rows || {};

        me.rows[name] = {
            required: true,
            defaultValue: opts.defaultValue,
            header: text,
            renderer: opts.renderer,
            editor: {
                xtype: 'proxmoxWindowEdit',
                subject: text,
                fieldDefaults: {
                    labelWidth: opts.labelWidth || 100,
                },
                items: {
                    xtype: 'proxmoxintegerfield',
                    name: name,
                    minValue: opts.minValue,
                    maxValue: opts.maxValue,
                    emptyText: gettext('Default'),
                    deleteEmpty: !!opts.deleteEmpty,
                    value: opts.defaultValue,
                    labelWidth: Proxmox.Utils.compute_min_label_width(text, opts.labelWidth),
                    fieldLabel: text,
                },
            },
        };
        if (opts.onlineHelp) {
            me.rows[name].editor.onlineHelp = opts.onlineHelp;
        }
    },

    // adds a row that allows editing in a full TextArea that transparently de/encodes as Base64
    add_textareafield_row: function (name, text, opts) {
        let me = this;

        opts = opts || {};
        me.rows = me.rows || {};
        let fieldOpts = opts.fieldOpts || {};

        me.rows[name] = {
            required: true,
            defaultValue: '',
            header: text,
            renderer: (value) => Ext.htmlEncode(Proxmox.Utils.base64ToUtf8(value)),
            editor: {
                xtype: 'proxmoxWindowEdit',
                subject: text,
                fieldDefaults: {
                    labelWidth: opts.labelWidth || 600,
                },
                items: {
                    xtype: 'proxmoxBase64TextArea',
                    ...fieldOpts,
                    name,
                },
            },
        };
        if (opts.onlineHelp) {
            me.rows[name].editor.onlineHelp = opts.onlineHelp;
        }
    },

    editorConfig: {}, // default config passed to editor

    run_editor: function () {
        let me = this;

        let sm = me.getSelectionModel();
        let rec = sm.getSelection()[0];
        if (!rec) {
            return;
        }

        let rows = me.rows;
        let rowdef = rows[rec.data.key];
        if (!rowdef.editor) {
            return;
        }

        let win;
        let config;
        if (Ext.isString(rowdef.editor)) {
            config = Ext.apply(
                {
                    confid: rec.data.key,
                },
                me.editorConfig,
            );
            win = Ext.create(rowdef.editor, config);
        } else {
            config = Ext.apply(
                {
                    confid: rec.data.key,
                },
                me.editorConfig,
            );
            Ext.apply(config, rowdef.editor);
            win = Ext.createWidget(rowdef.editor.xtype, config);
            win.load();
        }

        win.show();
        win.on('destroy', me.reload, me);
    },

    reload: function () {
        let me = this;
        me.rstore.load();
    },

    getObjectValue: function (key, defaultValue) {
        let me = this;
        let rec = me.store.getById(key);
        if (rec) {
            return rec.data.value;
        }
        return defaultValue;
    },

    renderKey: function (key, metaData, record, rowIndex, colIndex, store) {
        let me = this;
        let rows = me.rows;
        let rowdef = rows && rows[key] ? rows[key] : {};
        return rowdef.header || key;
    },

    renderValue: function (value, metaData, record, rowIndex, colIndex, store) {
        let me = this;
        let rows = me.rows;
        let key = record.data.key;
        let rowdef = rows && rows[key] ? rows[key] : {};

        let renderer = rowdef.renderer;
        if (renderer) {
            return renderer.call(me, value, metaData, record, rowIndex, colIndex, store);
        }

        return value;
    },

    listeners: {
        itemkeydown: function (view, record, item, index, e) {
            if (e.getKey() === e.ENTER) {
                this.pressedIndex = index;
            }
        },
        itemkeyup: function (view, record, item, index, e) {
            if (e.getKey() === e.ENTER && index === this.pressedIndex) {
                this.run_editor();
            }

            this.pressedIndex = undefined;
        },
    },

    initComponent: function () {
        let me = this;

        for (const rowdef of me.gridRows || []) {
            let addFn = me[`add_${rowdef.xtype}_row`];
            if (typeof addFn !== 'function') {
                throw `unknown object-grid row xtype '${rowdef.xtype}'`;
            } else if (typeof rowdef.name !== 'string') {
                throw `object-grid row need a valid name string-property!`;
            } else {
                addFn.call(me, rowdef.name, rowdef.text || rowdef.name, rowdef);
            }
        }

        let rows = me.rows;

        if (!me.rstore) {
            if (!me.url) {
                throw 'no url specified';
            }

            me.rstore = Ext.create('Proxmox.data.ObjectStore', {
                url: me.url,
                interval: me.interval,
                extraParams: me.extraParams,
                rows: me.rows,
            });
        }

        let rstore = me.rstore;
        let store = Ext.create('Proxmox.data.DiffStore', {
            rstore: rstore,
            sorters: [],
            filters: [],
        });

        if (rows) {
            for (const [key, rowdef] of Object.entries(rows)) {
                if (Ext.isDefined(rowdef.defaultValue)) {
                    store.add({ key: key, value: rowdef.defaultValue });
                } else if (rowdef.required) {
                    store.add({ key: key, value: undefined });
                }
            }
        }

        if (me.sorterFn) {
            store.sorters.add(
                Ext.create('Ext.util.Sorter', {
                    sorterFn: me.sorterFn,
                }),
            );
        }

        store.filters.add(
            Ext.create('Ext.util.Filter', {
                filterFn: function (item) {
                    if (rows) {
                        let rowdef = rows[item.data.key];
                        if (!rowdef || rowdef.visible === false) {
                            return false;
                        }
                    }
                    return true;
                },
            }),
        );

        Proxmox.Utils.monStoreErrors(me, rstore);

        Ext.applyIf(me, {
            store: store,
            stateful: false,
            columns: [
                {
                    header: gettext('Name'),
                    width: me.cwidth1 || 200,
                    dataIndex: 'key',
                    renderer: me.renderKey,
                },
                {
                    flex: 1,
                    header: gettext('Value'),
                    dataIndex: 'value',
                    renderer: me.renderValue,
                },
            ],
        });

        me.callParent();

        if (me.monStoreErrors) {
            Proxmox.Utils.monStoreErrors(me, me.store);
        }
    },
});
Ext.define('Proxmox.grid.PendingObjectGrid', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.proxmoxPendingObjectGrid'],

    getObjectValue: function (key, defaultValue, pending) {
        let me = this;
        let rec = me.store.getById(key);
        if (rec) {
            let value = rec.data.value;
            if (pending) {
                if (Ext.isDefined(rec.data.pending) && rec.data.pending !== '') {
                    value = rec.data.pending;
                } else if (rec.data.delete === 1) {
                    value = defaultValue;
                }
            }

            if (Ext.isDefined(value) && value !== '') {
                return value;
            } else {
                return defaultValue;
            }
        }
        return defaultValue;
    },

    hasPendingChanges: function (key) {
        let me = this;
        let rows = me.rows;
        let rowdef = rows && rows[key] ? rows[key] : {};
        let keys = rowdef.multiKey || [key];
        let pending = false;

        Ext.Array.each(keys, function (k) {
            let rec = me.store.getById(k);
            if (
                rec &&
                rec.data &&
                ((Ext.isDefined(rec.data.pending) && rec.data.pending !== '') ||
                    rec.data.delete === 1)
            ) {
                pending = true;
                return false; // break
            }
            return true;
        });

        return pending;
    },

    renderValue: function (value, metaData, record, rowIndex, colIndex, store) {
        let me = this;
        let rows = me.rows;
        let key = record.data.key;
        let rowdef = rows && rows[key] ? rows[key] : {};
        let renderer = rowdef.renderer;
        let current = '';
        let pending = '';

        if (renderer) {
            current = renderer(value, metaData, record, rowIndex, colIndex, store, false);
            if (me.hasPendingChanges(key)) {
                pending = renderer(
                    record.data.pending,
                    metaData,
                    record,
                    rowIndex,
                    colIndex,
                    store,
                    true,
                );
            }
            if (pending === current) {
                pending = undefined;
            }
        } else {
            current = value ?? '';
            pending = record.data.pending;
        }

        if (record.data.delete) {
            let delete_all = true;
            if (rowdef.multiKey) {
                Ext.Array.each(rowdef.multiKey, function (k) {
                    let rec = me.store.getById(k);
                    if (rec && rec.data && rec.data.delete !== 1) {
                        delete_all = false;
                        return false; // break
                    }
                    return true;
                });
            }
            if (delete_all) {
                pending = '<div style="text-decoration: line-through;">' + current + '</div>';
            }
        }

        if (pending) {
            return current + '<div style="color:darkorange">' + pending + '</div>';
        } else {
            return current;
        }
    },

    initComponent: function () {
        let me = this;

        if (!me.rstore) {
            if (!me.url) {
                throw 'no url specified';
            }

            me.rstore = Ext.create('Proxmox.data.ObjectStore', {
                model: 'KeyValuePendingDelete',
                readArray: true,
                url: me.url,
                interval: me.interval,
                extraParams: me.extraParams,
                rows: me.rows,
            });
        }

        me.callParent();
    },
});
Ext.define('Proxmox.panel.AuthView', {
    extend: 'Ext.grid.GridPanel',
    alias: 'widget.pmxAuthView',
    mixins: ['Proxmox.Mixin.CBind'],

    showDefaultRealm: false,

    stateful: true,
    stateId: 'grid-authrealms',

    viewConfig: {
        trackOver: false,
    },

    baseUrl: '/access/domains',
    storeBaseUrl: '/access/domains',

    columns: [
        {
            header: gettext('Realm'),
            width: 100,
            sortable: true,
            dataIndex: 'realm',
        },
        {
            header: gettext('Type'),
            width: 100,
            sortable: true,
            dataIndex: 'type',
        },
        {
            header: gettext('Default'),
            width: 80,
            sortable: true,
            dataIndex: 'default',
            renderer: (isDefault) => (isDefault ? Proxmox.Utils.renderEnabledIcon(true) : ''),
            align: 'center',
            cbind: {
                hidden: '{!showDefaultRealm}',
            },
        },
        {
            header: gettext('Comment'),
            sortable: false,
            dataIndex: 'comment',
            renderer: Ext.String.htmlEncode,
            flex: 1,
        },
    ],

    openEditWindow: function (authType, realm) {
        let me = this;
        const { useTypeInUrl, onlineHelp } = Proxmox.Schema.authDomains[authType];

        Ext.create('Proxmox.window.AuthEditBase', {
            baseUrl: me.baseUrl,
            useTypeInUrl,
            onlineHelp,
            authType,
            realm,
            showDefaultRealm: me.showDefaultRealm,
            listeners: {
                destroy: () => me.reload(),
            },
        }).show();
    },

    reload: function () {
        let me = this;
        me.getStore().load();
    },

    run_editor: function () {
        let me = this;
        let rec = me.getSelection()[0];
        if (!rec) {
            return;
        }

        if (!Proxmox.Schema.authDomains[rec.data.type].edit) {
            return;
        }

        me.openEditWindow(rec.data.type, rec.data.realm);
    },

    open_sync_window: function () {
        let rec = this.getSelection()[0];
        if (!rec) {
            return;
        }
        if (!Proxmox.Schema.authDomains[rec.data.type].sync) {
            return;
        }
        Ext.create('Proxmox.window.SyncWindow', {
            type: rec.data.type,
            realm: rec.data.realm,
            listeners: {
                destroy: () => this.reload(),
            },
        }).show();
    },

    initComponent: function () {
        var me = this;

        me.store = {
            model: 'pmx-domains',
            sorters: {
                property: 'realm',
                direction: 'ASC',
            },
            proxy: {
                type: 'proxmox',
                url: `/api2/json${me.storeBaseUrl}`,
            },
        };

        let menuitems = [];
        for (const [authType, config] of Object.entries(Proxmox.Schema.authDomains).sort()) {
            if (!config.add) {
                continue;
            }
            menuitems.push({
                text: config.name,
                iconCls: 'fa fa-fw ' + (config.iconCls || 'fa-address-book-o'),
                handler: () => me.openEditWindow(authType),
            });
        }

        let tbar = [
            {
                text: gettext('Add'),
                menu: {
                    items: menuitems,
                },
            },
            {
                xtype: 'proxmoxButton',
                text: gettext('Edit'),
                disabled: true,
                enableFn: (rec) => Proxmox.Schema.authDomains[rec.data.type].edit,
                handler: () => me.run_editor(),
            },
            {
                xtype: 'proxmoxStdRemoveButton',
                getUrl: (rec) => {
                    let url = me.baseUrl;
                    if (Proxmox.Schema.authDomains[rec.data.type].useTypeInUrl) {
                        url += `/${rec.get('type')}`;
                    }
                    url += `/${rec.getId()}`;
                    return url;
                },
                enableFn: (rec) => Proxmox.Schema.authDomains[rec.data.type].add,
                callback: () => me.reload(),
            },
            {
                xtype: 'proxmoxButton',
                text: gettext('Sync'),
                disabled: true,
                enableFn: (rec) => Proxmox.Schema.authDomains[rec.data.type].sync,
                handler: () => me.open_sync_window(),
            },
        ];

        if (me.extraButtons) {
            tbar.push('-');
            for (const button of me.extraButtons) {
                tbar.push(button);
            }
        }

        Ext.apply(me, {
            tbar,
            listeners: {
                activate: () => me.reload(),
                itemdblclick: () => me.run_editor(),
            },
        });

        me.callParent();
    },
});
Ext.define('pmx-disk-list', {
    extend: 'Ext.data.Model',
    fields: [
        'devpath',
        'used',
        { name: 'size', type: 'number' },
        { name: 'osdid', type: 'number', defaultValue: -1 },
        {
            name: 'status',
            convert: function (value, rec) {
                if (value) {
                    return value;
                }
                if (rec.data.health) {
                    return rec.data.health;
                }

                if (rec.data.type === 'partition') {
                    return '';
                }

                return Proxmox.Utils.unknownText;
            },
        },
        {
            name: 'name',
            convert: function (value, rec) {
                if (value) {
                    return value;
                }
                if (rec.data.devpath) {
                    return rec.data.devpath;
                }
                return undefined;
            },
        },
        {
            name: 'disk-type',
            convert: function (value, rec) {
                if (value) {
                    return value;
                }
                if (rec.data.type) {
                    return rec.data.type;
                }
                return undefined;
            },
        },
        'vendor',
        'model',
        'serial',
        'rpm',
        'type',
        'wearout',
        'health',
        'mounted',
    ],
    idProperty: 'devpath',
});

Ext.define('Proxmox.DiskList', {
    extend: 'Ext.tree.Panel',
    alias: 'widget.pmxDiskList',

    supportsWipeDisk: false,

    rootVisible: false,

    emptyText: gettext('No Disks found'),

    stateful: true,
    stateId: 'tree-node-disks',

    controller: {
        xclass: 'Ext.app.ViewController',

        reload: function () {
            let me = this;
            let view = me.getView();

            let extraParams = {};
            if (view.includePartitions) {
                extraParams['include-partitions'] = 1;
            }

            let url = `${view.baseurl}/list`;
            me.store.setProxy({
                type: 'proxmox',
                extraParams: extraParams,
                url: url,
            });
            me.store.load();
        },

        openSmartWindow: function () {
            let me = this;
            let view = me.getView();
            let selection = view.getSelection();
            if (!selection || selection.length < 1) {
                return;
            }

            let rec = selection[0];
            Ext.create('Proxmox.window.DiskSmart', {
                baseurl: view.baseurl,
                dev: rec.data.name,
            }).show();
        },

        initGPT: function () {
            let me = this;
            let view = me.getView();
            let selection = view.getSelection();
            if (!selection || selection.length < 1) {
                return;
            }

            let rec = selection[0];
            Proxmox.Utils.API2Request({
                url: `${view.exturl}/initgpt`,
                waitMsgTarget: view,
                method: 'POST',
                params: { disk: rec.data.name },
                failure: (response) => Ext.Msg.alert(gettext('Error'), response.htmlStatus),
                success: function (response, options) {
                    Ext.create('Proxmox.window.TaskProgress', {
                        upid: response.result.data,
                        taskDone: function () {
                            me.reload();
                        },
                        autoShow: true,
                    });
                },
            });
        },

        wipeDisk: function () {
            let me = this;
            let view = me.getView();
            let selection = view.getSelection();
            if (!selection || selection.length < 1) {
                return;
            }

            let rec = selection[0];
            Proxmox.Utils.API2Request({
                url: `${view.exturl}/wipedisk`,
                waitMsgTarget: view,
                method: 'PUT',
                params: { disk: rec.data.name },
                failure: (response) => Ext.Msg.alert(gettext('Error'), response.htmlStatus),
                success: function (response, options) {
                    Ext.create('Proxmox.window.TaskProgress', {
                        upid: response.result.data,
                        taskDone: function () {
                            me.reload();
                        },
                        autoShow: true,
                    });
                },
            });
        },

        init: function (view) {
            let nodename = view.nodename || 'localhost';
            view.baseurl = `/api2/json/nodes/${nodename}/disks`;
            view.exturl = `/api2/extjs/nodes/${nodename}/disks`;

            this.store = Ext.create('Ext.data.Store', {
                model: 'pmx-disk-list',
            });
            this.store.on('load', this.onLoad, this);

            Proxmox.Utils.monStoreErrors(view, this.store);
            this.reload();
        },

        onLoad: function (store, records, success, operation) {
            let _me = this;
            let view = this.getView();

            if (!success) {
                Proxmox.Utils.setErrorMask(
                    view,
                    Proxmox.Utils.getResponseErrorMessage(operation.getError()),
                );
                return;
            }

            let disks = {};

            for (const item of records) {
                let data = item.data;
                data.expanded = true;
                data.children = data.partitions ?? [];
                for (let p of data.children) {
                    p['disk-type'] = 'partition';
                    p.iconCls = 'fa fa-fw fa-hdd-o x-fa-tree';
                    p.used = p.used === 'filesystem' ? p.filesystem : p.used;
                    p.parent = data.devpath;
                    p.children = [];
                    p.leaf = true;
                }
                data.iconCls = 'fa fa-fw fa-hdd-o x-fa-tree';
                data.leaf = data.children.length === 0;

                if (!data.parent) {
                    disks[data.devpath] = data;
                }
            }
            for (const item of records) {
                let data = item.data;
                if (data.parent) {
                    disks[data.parent].leaf = false;
                    disks[data.parent].children.push(data);
                }
            }

            let children = [];
            for (const [_, device] of Object.entries(disks)) {
                children.push(device);
            }

            view.setRootNode({
                expanded: true,
                children: children,
            });

            Proxmox.Utils.setErrorMask(view, false);
        },
    },

    renderDiskType: function (v) {
        if (v === undefined) {
            return Proxmox.Utils.unknownText;
        }
        switch (v) {
            case 'ssd':
                return 'SSD';
            case 'hdd':
                return 'Hard Disk';
            case 'usb':
                return 'USB';
            default:
                return v;
        }
    },

    renderDiskUsage: function (v, metaData, rec) {
        let extendedInfo = '';
        if (rec) {
            let types = [];
            if (rec.data['osdid-list'] && rec.data['osdid-list'].length > 0) {
                for (const id of rec.data['osdid-list'].sort()) {
                    types.push(`OSD.${id.toString()}`);
                }
            } else if (rec.data.osdid !== undefined && rec.data.osdid >= 0) {
                types.push(`OSD.${rec.data.osdid.toString()}`);
            }
            if (rec.data.journals > 0) {
                types.push('Journal');
            }
            if (rec.data.db > 0) {
                types.push('DB');
            }
            if (rec.data.wal > 0) {
                types.push('WAL');
            }
            if (types.length > 0) {
                extendedInfo = `, Ceph (${types.join(', ')})`;
            }
        }
        const formatMap = {
            bios: 'BIOS boot',
            zfsreserved: 'ZFS reserved',
            efi: 'EFI',
            lvm: 'LVM',
            zfs: 'ZFS',
        };

        v = formatMap[v] || v;
        return v ? `${v}${extendedInfo}` : Proxmox.Utils.noText;
    },

    columns: [
        {
            xtype: 'treecolumn',
            header: gettext('Device'),
            width: 150,
            sortable: true,
            dataIndex: 'devpath',
        },
        {
            header: gettext('Type'),
            width: 80,
            sortable: true,
            dataIndex: 'disk-type',
            renderer: function (v) {
                let me = this;
                return me.renderDiskType(v);
            },
        },
        {
            header: gettext('Usage'),
            width: 150,
            sortable: false,
            renderer: function (v, metaData, rec) {
                let me = this;
                return me.renderDiskUsage(v, metaData, rec);
            },
            dataIndex: 'used',
        },
        {
            header: gettext('Size'),
            width: 100,
            align: 'right',
            sortable: true,
            renderer: Proxmox.Utils.format_size,
            dataIndex: 'size',
        },
        {
            header: 'GPT',
            width: 60,
            align: 'right',
            renderer: Proxmox.Utils.format_boolean,
            dataIndex: 'gpt',
        },
        {
            header: gettext('Vendor'),
            width: 100,
            sortable: true,
            hidden: true,
            renderer: Ext.String.htmlEncode,
            dataIndex: 'vendor',
        },
        {
            header: gettext('Model'),
            width: 200,
            sortable: true,
            renderer: Ext.String.htmlEncode,
            dataIndex: 'model',
        },
        {
            header: gettext('Serial'),
            width: 200,
            sortable: true,
            renderer: Ext.String.htmlEncode,
            dataIndex: 'serial',
        },
        {
            header: 'S.M.A.R.T.',
            width: 100,
            sortable: true,
            renderer: Ext.String.htmlEncode,
            dataIndex: 'status',
        },
        {
            header: gettext('Mounted'),
            width: 60,
            align: 'right',
            renderer: Proxmox.Utils.format_boolean,
            dataIndex: 'mounted',
        },
        {
            header: gettext('Wearout'),
            width: 90,
            sortable: true,
            align: 'right',
            dataIndex: 'wearout',
            renderer: function (value) {
                if (Ext.isNumeric(value)) {
                    return (100 - value).toString() + '%';
                }
                return gettext('N/A');
            },
        },
    ],

    listeners: {
        itemdblclick: 'openSmartWindow',
    },

    initComponent: function () {
        let me = this;

        let tbar = [
            {
                text: gettext('Reload'),
                handler: 'reload',
            },
            {
                xtype: 'proxmoxButton',
                text: gettext('Show S.M.A.R.T. values'),
                parentXType: 'treepanel',
                disabled: true,
                enableFn: function (rec) {
                    if (!rec || rec.data.parent) {
                        return false;
                    } else {
                        return true;
                    }
                },
                handler: 'openSmartWindow',
            },
            {
                xtype: 'proxmoxButton',
                text: gettext('Initialize Disk with GPT'),
                parentXType: 'treepanel',
                disabled: true,
                enableFn: function (rec) {
                    if (!rec || rec.data.parent || (rec.data.used && rec.data.used !== 'unused')) {
                        return false;
                    } else {
                        return true;
                    }
                },
                handler: 'initGPT',
            },
        ];

        if (me.supportsWipeDisk) {
            tbar.push('-');
            tbar.push({
                xtype: 'proxmoxButton',
                text: gettext('Wipe Disk'),
                parentXType: 'treepanel',
                dangerous: true,
                confirmMsg: function (rec) {
                    const data = rec.data;

                    let mainMessage = Ext.String.format(
                        gettext('Are you sure you want to wipe {0}?'),
                        data.devpath,
                    );
                    mainMessage += `<br> ${gettext('All data on the device will be lost!')}`;

                    const type = me.renderDiskType(data['disk-type']);

                    let usage;
                    if (data.children.length > 0) {
                        const partitionUsage = data.children
                            .map((partition) => me.renderDiskUsage(partition.used))
                            .join(', ');
                        usage = `${gettext('Partitions')} (${partitionUsage})`;
                    } else {
                        usage = me.renderDiskUsage(data.used, undefined, rec);
                    }

                    const size = Proxmox.Utils.format_size(data.size);
                    const serial = Ext.String.htmlEncode(data.serial);

                    let additionalInfo = `${gettext('Type')}: ${type}<br>`;
                    additionalInfo += `${gettext('Usage')}: ${usage}<br>`;
                    additionalInfo += `${gettext('Size')}: ${size}<br>`;
                    additionalInfo += `${gettext('Serial')}: ${serial}`;

                    return `${mainMessage}<br><br>${additionalInfo}`;
                },
                disabled: true,
                handler: 'wipeDisk',
            });
        }

        me.tbar = tbar;

        me.callParent();
    },
});
// not realy a panel descendant, but its the best (existing) place for this
Ext.define('Proxmox.EOLNotice', {
    extend: 'Ext.Component',
    alias: 'widget.proxmoxEOLNotice',

    userCls: 'eol-notice',
    padding: '0 5',

    config: {
        product: '',
        version: '',
        eolDate: '',
        href: '',
    },

    autoEl: {
        tag: 'div',
        'data-qtip': gettext(
            "You won't get any security fixes after the End-Of-Life date. Please consider upgrading.",
        ),
    },

    getIconCls: function () {
        let me = this;

        const now = new Date();
        const eolDate = new Date(me.eolDate);
        const warningCutoff = new Date(eolDate.getTime() - 21 * 24 * 60 * 60 * 1000); // 3 weeks

        return now > warningCutoff
            ? 'critical fa-exclamation-triangle'
            : 'info-blue fa-info-circle';
    },

    initComponent: function () {
        let me = this;

        let iconCls = me.getIconCls();
        let href = me.href.startsWith('http') ? me.href : `https://${me.href}`;
        let message = Ext.String.format(
            gettext('Support for {0} {1} ends on {2}'),
            me.product,
            me.version,
            me.eolDate,
        );

        me.html = `<i class="fa ${iconCls}"></i>
	    <a href="${href}" target="_blank">${message} <i class="fa fa-external-link"></i></a>
	`;

        me.callParent();
    },
});
Ext.define('Proxmox.panel.InputPanel', {
    extend: 'Ext.panel.Panel',
    alias: ['widget.inputpanel'],
    listeners: {
        activate: function () {
            // notify owning container that it should display a help button
            if (this.onlineHelp) {
                Ext.GlobalEvents.fireEvent('proxmoxShowHelp', this.onlineHelp);
            }
        },
        deactivate: function () {
            if (this.onlineHelp) {
                Ext.GlobalEvents.fireEvent('proxmoxHideHelp', this.onlineHelp);
            }
        },
    },
    border: false,

    // override this with an URL to a relevant chapter of the pve manual
    // setting this will display a help button in our parent panel
    onlineHelp: undefined,

    // will be set if the inputpanel has advanced items
    hasAdvanced: false,

    // if the panel has advanced items, this will determine if they are shown by default
    showAdvanced: false,

    // overwrite this to modify submit data
    onGetValues: function (values) {
        return values;
    },

    getValues: function (dirtyOnly) {
        let me = this;

        if (Ext.isFunction(me.onGetValues)) {
            dirtyOnly = false;
        }

        let values = {};

        Ext.Array.each(me.query('[isFormField]'), function (field) {
            if (!dirtyOnly || field.isDirty()) {
                Proxmox.Utils.assemble_field_data(values, field.getSubmitData());
            }
        });

        return me.onGetValues(values);
    },

    setAdvancedVisible: function (visible) {
        let me = this;
        let advItems = me.getComponent('advancedContainer');
        if (advItems) {
            advItems.setVisible(visible);
        }
    },

    onSetValues: function (values) {
        return values;
    },

    setValues: function (values) {
        let me = this;

        let form = me.up('form');

        values = me.onSetValues(values);

        Ext.iterate(values, function (fieldId, val) {
            let fields = me.query('[isFormField][name=' + fieldId + ']');
            for (const field of fields) {
                if (field) {
                    field.setValue(val);
                    if (form.trackResetOnLoad) {
                        field.resetOriginalValue();
                    }
                }
            }
        });
    },

    /**
     *  inputpanel, vbox
     * +---------------------------------------------------------------------+
     * |                             columnT                                 |
     * +---------------------------------------------------------------------+
     * |                          container, hbox                            |
     * |  +---------------+---------------+---------------+---------------+  |
     * |  |    column1    |    column2    |    column3    |    column4    |  |
     * |  | panel, anchor | panel, anchor | panel, anchor | panel, anchor |  |
     * |  +---------------+---------------+---------------+---------------+  |
     * +---------------------------------------------------------------------+
     * |                             columnB                                 |
     * +---------------------------------------------------------------------+
     */
    initComponent: function () {
        let me = this;

        let items;

        if (me.items) {
            items = [
                {
                    layout: 'anchor',
                    items: me.items,
                },
            ];
            me.items = undefined;
        } else if (me.column4) {
            items = [];
            if (me.columnT) {
                items.push({
                    padding: '0 0 0 0',
                    layout: 'anchor',
                    items: me.columnT,
                });
            }
            items.push({
                layout: 'hbox',
                defaults: {
                    border: false,
                    layout: 'anchor',
                    flex: 1,
                },
                items: [
                    {
                        padding: '0 10 0 0',
                        items: me.column1,
                    },
                    {
                        padding: '0 10 0 0',
                        items: me.column2,
                    },
                    {
                        padding: '0 10 0 0',
                        items: me.column3,
                    },
                    {
                        padding: '0 0 0 10',
                        items: me.column4,
                    },
                ],
            });
            if (me.columnB) {
                items.push({
                    padding: '10 0 0 0',
                    layout: 'anchor',
                    items: me.columnB,
                });
            }
        } else if (me.column1) {
            items = [];
            if (me.columnT) {
                items.push({
                    padding: '0 0 10 0',
                    layout: 'anchor',
                    items: me.columnT,
                });
            }
            items.push({
                layout: 'hbox',
                defaults: {
                    border: false,
                    layout: 'anchor',
                    flex: 1,
                },
                items: [
                    {
                        padding: '0 10 0 0',
                        items: me.column1,
                    },
                    {
                        padding: '0 0 0 10',
                        items: me.column2 || [], // allow empty column
                    },
                ],
            });
            if (me.columnB) {
                items.push({
                    padding: '10 0 0 0',
                    layout: 'anchor',
                    items: me.columnB,
                });
            }
        } else {
            throw 'unsupported config';
        }

        let advItems;
        if (me.advancedItems) {
            advItems = [
                {
                    layout: 'anchor',
                    items: me.advancedItems,
                },
            ];
            me.advancedItems = undefined;
        } else if (me.advancedColumn1 || me.advancedColumn2 || me.advancedColumnB) {
            advItems = [
                {
                    layout: {
                        type: 'hbox',
                        align: 'begin',
                    },
                    defaults: {
                        border: false,
                        layout: 'anchor',
                        flex: 1,
                    },
                    items: [
                        {
                            padding: '0 10 0 0',
                            items: me.advancedColumn1 || [], // allow empty column
                        },
                        {
                            padding: '0 0 0 10',
                            items: me.advancedColumn2 || [], // allow empty column
                        },
                    ],
                },
            ];

            me.advancedColumn1 = undefined;
            me.advancedColumn2 = undefined;

            if (me.advancedColumnB) {
                advItems.push({
                    padding: '10 0 0 0',
                    layout: 'anchor',
                    items: me.advancedColumnB,
                });
                me.advancedColumnB = undefined;
            }
        }

        if (advItems) {
            me.hasAdvanced = true;
            advItems.unshift({
                xtype: 'box',
                hidden: false,
                border: true,
                autoEl: {
                    tag: 'hr',
                },
            });
            items.push({
                xtype: 'container',
                itemId: 'advancedContainer',
                hidden: !me.showAdvanced,
                defaults: {
                    border: false,
                },
                items: advItems,
            });
        }

        Ext.apply(me, {
            layout: {
                type: 'vbox',
                align: 'stretch',
            },
            defaultType: 'container',
            items: items,
        });

        me.callParent();
    },
});
Ext.define('Proxmox.widget.Info', {
    extend: 'Ext.container.Container',
    alias: 'widget.pmxInfoWidget',

    layout: {
        type: 'vbox',
        align: 'stretch',
    },

    value: 0,
    maximum: 1,
    printBar: true,
    items: [
        {
            xtype: 'component',
            itemId: 'label',
            data: {
                title: '',
                usage: '',
                iconCls: undefined,
            },
            tpl: [
                '<div class="left-aligned">',
                '<tpl if="iconCls">',
                '<i class="{iconCls}"></i> ',
                '</tpl>',
                '{title}</div>&nbsp;<div class="right-aligned">{usage}</div>',
            ],
        },
        {
            height: 2,
            border: 0,
        },
        {
            xtype: 'progressbar',
            itemId: 'progress',
            height: 5,
            value: 0,
            animate: true,
        },
    ],

    warningThreshold: 0.75,
    criticalThreshold: 0.9,

    setPrintBar: function (enable) {
        var me = this;
        me.printBar = enable;
        me.getComponent('progress').setVisible(enable);
    },

    setIconCls: function (iconCls) {
        var me = this;
        me.getComponent('label').data.iconCls = iconCls;
    },

    setData: function (data) {
        this.updateValue(data.text, data.usage);
    },

    updateValue: function (text, usage) {
        let me = this;

        if (me.lastText === text && me.lastUsage === usage) {
            return;
        }
        me.lastText = text;
        me.lastUsage = usage;

        var label = me.getComponent('label');
        label.update(Ext.apply(label.data, { title: me.title, usage: text }));

        if (usage !== undefined && me.printBar && Ext.isNumeric(usage) && usage >= 0) {
            let progressBar = me.getComponent('progress');
            progressBar.updateProgress(usage, '');
            if (usage > me.criticalThreshold) {
                progressBar.removeCls('warning');
                progressBar.addCls('critical');
            } else if (usage > me.warningThreshold) {
                progressBar.removeCls('critical');
                progressBar.addCls('warning');
            } else {
                progressBar.removeCls('warning');
                progressBar.removeCls('critical');
            }
        }
    },

    initComponent: function () {
        var me = this;

        if (!me.title) {
            throw 'no title defined';
        }

        me.callParent();

        me.getComponent('progress').setVisible(me.printBar);

        me.updateValue(me.text, me.value);
        me.setIconCls(me.iconCls);
    },
});
/*
 * Display log entries in a panel with scrollbar
 * The log entries are automatically refreshed via a background task,
 * with newest entries coming at the bottom
 */
Ext.define('Proxmox.panel.LogView', {
    extend: 'Ext.panel.Panel',
    xtype: 'proxmoxLogView',

    pageSize: 510,
    viewBuffer: 50,
    lineHeight: 16,

    scrollToEnd: true,

    // callback for load failure, used for ceph
    failCallback: undefined,

    controller: {
        xclass: 'Ext.app.ViewController',

        updateParams: function () {
            let me = this;
            let viewModel = me.getViewModel();

            if (viewModel.get('hide_timespan') || viewModel.get('livemode')) {
                return;
            }

            let since = viewModel.get('since');
            let until = viewModel.get('until');

            if (since > until) {
                Ext.Msg.alert('Error', 'Since date must be less equal than Until date.');
                return;
            }

            let submitFormat = viewModel.get('submitFormat');

            viewModel.set('params.since', Ext.Date.format(since, submitFormat));
            if (submitFormat === 'Y-m-d') {
                viewModel.set('params.until', Ext.Date.format(until, submitFormat) + ' 23:59:59');
            } else {
                viewModel.set('params.until', Ext.Date.format(until, submitFormat));
            }

            me.getView().loadTask.delay(200);
        },

        scrollPosBottom: function () {
            let view = this.getView();
            let pos = view.getScrollY();
            let maxPos = view.getScrollable().getMaxPosition().y;
            return maxPos - pos;
        },

        updateView: function (lines, first, total) {
            let me = this;
            let view = me.getView();
            let viewModel = me.getViewModel();
            let content = me.lookup('content');
            let data = viewModel.get('data');

            if (first === data.first && total === data.total && lines.length === data.lines) {
                // before there is any real output, we get 'no output' as a single line, so always
                // update if we only have one to be sure to catch the first real line of output
                if (total !== 1) {
                    return; // same content, skip setting and scrolling
                }
            }
            viewModel.set('data', {
                first: first,
                total: total,
                lines: lines.length,
            });

            let scrollPos = me.scrollPosBottom();
            let scrollToBottom = view.scrollToEnd && scrollPos <= 5;

            if (!scrollToBottom) {
                // so that we have the 'correct' height for the text
                lines.length = total;
            }

            content.update(lines.join('<br>'));

            if (scrollToBottom) {
                let scroller = view.getScrollable();
                scroller.suspendEvent('scroll');
                view.scrollTo(view.getScrollX() ?? 0, Infinity);
                me.updateStart(true);
                scroller.resumeEvent('scroll');
            }
        },

        doLoad: function () {
            let me = this;
            if (me.running) {
                me.requested = true;
                return;
            }
            me.running = true;
            let view = me.getView();
            let viewModel = me.getViewModel();
            Proxmox.Utils.API2Request({
                url: me.getView().url,
                params: viewModel.get('params'),
                method: 'GET',
                success: function (response) {
                    if (me.isDestroyed) {
                        return;
                    }
                    Proxmox.Utils.setErrorMask(me, false);
                    let total = response.result.total;
                    let lines = [];
                    let first = Infinity;

                    Ext.Array.each(response.result.data, function (line) {
                        if (first > line.n) {
                            first = line.n;
                        }
                        lines[line.n - 1] = Ext.htmlEncode(line.t);
                    });

                    me.updateView(lines, first - 1, total);
                    me.running = false;
                    if (me.requested) {
                        me.requested = false;
                        view.loadTask.delay(200);
                    }
                },
                failure: function (response) {
                    if (view.failCallback) {
                        view.failCallback(response);
                    } else {
                        let msg = response.htmlStatus;
                        Proxmox.Utils.setErrorMask(me, msg);
                    }
                    me.running = false;
                    if (me.requested) {
                        me.requested = false;
                        view.loadTask.delay(200);
                    }
                },
            });
        },

        updateStart: function (scrolledToBottom, targetLine) {
            let me = this;
            let view = me.getView(),
                viewModel = me.getViewModel();

            let limit = viewModel.get('params.limit');
            let total = viewModel.get('data.total');

            // heuristic: scroll up? -> load more in front; scroll down? -> load more at end
            let startRatio =
                view.lastTargetLine && view.lastTargetLine > targetLine ? 2 / 3 : 1 / 3;
            view.lastTargetLine = targetLine;

            let newStart = scrolledToBottom
                ? Math.trunc(total - limit, 10)
                : Math.trunc(targetLine - startRatio * limit + 10);

            viewModel.set('params.start', Math.max(newStart, 0));

            view.loadTask.delay(200);
        },

        onScroll: function (x, y) {
            let me = this;
            let view = me.getView(),
                viewModel = me.getViewModel();

            let line = view.getScrollY() / view.lineHeight;
            let viewLines = view.getHeight() / view.lineHeight;

            let viewStart = Math.max(Math.trunc(line - 1 - view.viewBuffer), 0);
            let viewEnd = Math.trunc(line + viewLines + 1 + view.viewBuffer);

            let { start, limit } = viewModel.get('params');

            let margin = start < 20 ? 0 : 20;

            if (viewStart < start + margin || viewEnd > start + limit - margin) {
                me.updateStart(false, line);
            }
        },

        onLiveMode: function () {
            let me = this;
            let viewModel = me.getViewModel();
            viewModel.set('livemode', true);
            viewModel.set('params', { start: 0, limit: 510 });

            let view = me.getView();
            delete view.content;
            view.scrollToEnd = true;
            me.updateView([], true, false);
        },

        onTimespan: function () {
            let me = this;
            me.getViewModel().set('livemode', false);
            me.updateView([], false);
            // Directly apply currently selected values without update
            // button click.
            me.updateParams();
        },

        init: function (view) {
            let me = this;

            if (!view.url) {
                throw 'no url specified';
            }

            let viewModel = this.getViewModel();
            let since = new Date();
            since.setDate(since.getDate() - 3);
            viewModel.set('until', new Date());
            viewModel.set('since', since);
            viewModel.set('params.limit', view.pageSize);
            viewModel.set('hide_timespan', !view.log_select_timespan);
            viewModel.set('submitFormat', view.submitFormat);
            me.lookup('content').setStyle('line-height', `${view.lineHeight}px`);

            view.loadTask = new Ext.util.DelayedTask(me.doLoad, me);

            me.updateParams();
            view.task = Ext.TaskManager.start({
                run: () => {
                    if (!view.isVisible() || !view.scrollToEnd) {
                        return;
                    }
                    if (me.scrollPosBottom() <= 5) {
                        view.loadTask.delay(200);
                    }
                },
                interval: 1000,
            });
        },
    },

    onDestroy: function () {
        let me = this;
        me.loadTask.cancel();
        Ext.TaskManager.stop(me.task);
    },

    // for user to initiate a load from outside
    requestUpdate: function () {
        let me = this;
        me.loadTask.delay(200);
    },

    viewModel: {
        data: {
            until: null,
            since: null,
            submitFormat: 'Y-m-d',
            livemode: true,
            hide_timespan: false,
            data: {
                start: 0,
                total: 0,
                textlen: 0,
            },
            params: {
                start: 0,
                limit: 510,
            },
        },
    },

    layout: 'auto',
    bodyPadding: 5,
    scrollable: {
        x: 'auto',
        y: 'auto',
        listeners: {
            // we have to have this here, since we cannot listen to events of the scroller in
            // the viewcontroller (extjs bug?), nor does the panel have a 'scroll' event'
            scroll: {
                fn: function (scroller, x, y) {
                    let controller = this.component.getController();
                    if (controller) {
                        // on destroy, controller can be gone
                        controller.onScroll(x, y);
                    }
                },
                buffer: 200,
            },
        },
    },

    tbar: {
        bind: {
            hidden: '{hide_timespan}',
        },
        items: [
            '->',
            {
                xtype: 'segmentedbutton',
                items: [
                    {
                        text: gettext('Live Mode'),
                        bind: {
                            pressed: '{livemode}',
                        },
                        handler: 'onLiveMode',
                    },
                    {
                        text: gettext('Select Timespan'),
                        bind: {
                            pressed: '{!livemode}',
                        },
                        handler: 'onTimespan',
                    },
                ],
            },
            {
                xtype: 'box',
                autoEl: { cn: gettext('Since') + ':' },
                bind: {
                    disabled: '{livemode}',
                },
            },
            {
                xtype: 'proxmoxDateTimeField',
                name: 'since_date',
                reference: 'since',
                format: 'Y-m-d',
                bind: {
                    disabled: '{livemode}',
                    value: '{since}',
                    maxValue: '{until}',
                    submitFormat: '{submitFormat}',
                },
            },
            {
                xtype: 'box',
                autoEl: { cn: gettext('Until') + ':' },
                bind: {
                    disabled: '{livemode}',
                },
            },
            {
                xtype: 'proxmoxDateTimeField',
                name: 'until_date',
                reference: 'until',
                format: 'Y-m-d',
                bind: {
                    disabled: '{livemode}',
                    value: '{until}',
                    minValue: '{since}',
                    submitFormat: '{submitFormat}',
                },
            },
            {
                xtype: 'button',
                text: 'Update',
                handler: 'updateParams',
                bind: {
                    disabled: '{livemode}',
                },
            },
        ],
    },

    items: [
        {
            xtype: 'box',
            reference: 'content',
            style: {
                font: 'normal 11px tahoma, arial, verdana, sans-serif',
                'white-space': 'pre',
            },
        },
    ],
});
Ext.define('Proxmox.widget.NodeInfoRepoStatus', {
    extend: 'Proxmox.widget.Info',
    alias: 'widget.pmxNodeInfoRepoStatus',

    title: gettext('Repository Status'),

    colspan: 2,

    printBar: false,

    product: undefined,
    repoLink: undefined,

    viewModel: {
        data: {
            subscriptionActive: '',
            noSubscriptionRepo: '',
            enterpriseRepo: '',
            testRepo: '',
        },

        formulas: {
            repoStatus: function (get) {
                if (get('subscriptionActive') === '' || get('enterpriseRepo') === '') {
                    return '';
                }

                if (get('noSubscriptionRepo') || get('testRepo')) {
                    return 'non-production';
                } else if (get('subscriptionActive') && get('enterpriseRepo')) {
                    return 'ok';
                } else if (!get('subscriptionActive') && get('enterpriseRepo')) {
                    return 'no-sub';
                } else if (
                    !get('enterpriseRepo') ||
                    !get('noSubscriptionRepo') ||
                    !get('testRepo')
                ) {
                    return 'no-repo';
                }
                return 'unknown';
            },

            repoStatusMessage: function (get) {
                let me = this;
                let view = me.getView();

                const status = get('repoStatus');

                let repoLink = ` <a data-qtip="${gettext('Open Repositories Panel')}"
		    href="${view.repoLink}">
		    <i class="fa black fa-chevron-right txt-shadow-hover"></i>
		    </a>`;

                return Proxmox.Utils.formatNodeRepoStatus(status, view.product) + repoLink;
            },
        },
    },

    setValue: function (value) {
        // for binding below
        this.updateValue(value);
    },

    bind: {
        value: '{repoStatusMessage}',
    },

    setRepositoryInfo: function (standardRepos) {
        let me = this;
        let vm = me.getViewModel();

        for (const standardRepo of standardRepos) {
            const handle = standardRepo.handle;
            const status = standardRepo.status || 0;

            if (handle === 'enterprise') {
                vm.set('enterpriseRepo', status);
            } else if (handle === 'no-subscription') {
                vm.set('noSubscriptionRepo', status);
            } else if (handle === 'test') {
                vm.set('testRepo', status);
            }
        }
    },

    setSubscriptionStatus: function (status) {
        let me = this;
        let vm = me.getViewModel();

        vm.set('subscriptionActive', status);
    },

    initComponent: function () {
        let me = this;

        if (me.product === undefined) {
            throw 'no product name provided';
        }

        if (me.repoLink === undefined) {
            throw 'no repo link href provided';
        }

        me.callParent();
    },
});
Ext.define('Proxmox.panel.NotificationConfigViewModel', {
    extend: 'Ext.app.ViewModel',

    alias: 'viewmodel.pmxNotificationConfigPanel',

    formulas: {
        builtinSelected: function (get) {
            let origin = get('selection')?.get('origin');
            return origin === 'modified-builtin' || origin === 'builtin';
        },
        removeButtonText: (get) => (get('builtinSelected') ? gettext('Reset') : gettext('Remove')),
        removeButtonConfirmMessage: function (get) {
            if (get('builtinSelected')) {
                return gettext('Do you want to reset {0} to its default settings?');
            } else {
                // Use default message provided by the button
                return undefined;
            }
        },
    },
});

Ext.define('Proxmox.panel.NotificationConfigView', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pmxNotificationConfigView',
    mixins: ['Proxmox.Mixin.CBind'],
    onlineHelp: 'chapter_notifications',
    layout: {
        type: 'border',
    },

    items: [
        {
            region: 'center',
            border: false,
            xtype: 'pmxNotificationEndpointView',
            cbind: {
                baseUrl: '{baseUrl}',
            },
        },
        {
            region: 'south',
            height: '50%',
            border: false,
            collapsible: true,
            animCollapse: false,
            xtype: 'pmxNotificationMatcherView',
            cbind: {
                baseUrl: '{baseUrl}',
            },
        },
    ],
});

Ext.define('Proxmox.panel.NotificationEndpointView', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.pmxNotificationEndpointView',

    title: gettext('Notification Targets'),

    viewModel: {
        type: 'pmxNotificationConfigPanel',
    },

    bind: {
        selection: '{selection}',
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        openEditWindow: function (endpointType, endpoint) {
            let me = this;

            Ext.create('Proxmox.window.EndpointEditBase', {
                baseUrl: me.getView().baseUrl,
                type: endpointType,

                name: endpoint,
                autoShow: true,
                listeners: {
                    destroy: () => me.reload(),
                },
            });
        },

        openEditForSelectedItem: function () {
            let me = this;
            let view = me.getView();

            let selection = view.getSelection();
            if (selection.length < 1) {
                return;
            }

            me.openEditWindow(selection[0].data.type, selection[0].data.name);
        },

        reload: function () {
            let me = this;
            let view = me.getView();
            view.getStore().rstore.load();
            this.getView().setSelection(null);
        },

        testEndpoint: function () {
            let me = this;
            let view = me.getView();

            let selection = view.getSelection();
            if (selection.length < 1) {
                return;
            }

            let target = selection[0].data.name;

            Ext.Msg.confirm(
                gettext('Notification Target Test'),
                Ext.String.format(
                    gettext("Do you want to send a test notification to '{0}'?"),
                    target,
                ),
                function (decision) {
                    if (decision !== 'yes') {
                        return;
                    }

                    Proxmox.Utils.API2Request({
                        method: 'POST',
                        url: `${view.baseUrl}/targets/${target}/test`,

                        success: function (response, opt) {
                            Ext.Msg.show({
                                title: gettext('Notification Target Test'),
                                message: Ext.String.format(
                                    gettext("Sent test notification to '{0}'."),
                                    target,
                                ),
                                buttons: Ext.Msg.OK,
                                icon: Ext.Msg.INFO,
                            });
                        },
                        autoErrorAlert: true,
                    });
                },
            );
        },
    },

    listeners: {
        itemdblclick: 'openEditForSelectedItem',
        activate: 'reload',
    },

    emptyText: gettext('No notification targets configured'),

    columns: [
        {
            dataIndex: 'disable',
            text: gettext('Enable'),
            renderer: (disable) => Proxmox.Utils.renderEnabledIcon(!disable),
            align: 'center',
        },
        {
            dataIndex: 'name',
            text: gettext('Target Name'),
            renderer: Ext.String.htmlEncode,
            flex: 2,
        },
        {
            dataIndex: 'type',
            text: gettext('Type'),
            renderer: Ext.String.htmlEncode,
            flex: 1,
        },
        {
            dataIndex: 'comment',
            text: gettext('Comment'),
            renderer: Ext.String.htmlEncode,
            flex: 3,
        },
        {
            dataIndex: 'origin',
            text: gettext('Origin'),
            renderer: (origin) => {
                switch (origin) {
                    case 'user-created':
                        return gettext('Custom');
                    case 'modified-builtin':
                        return gettext('Built-In (modified)');
                    case 'builtin':
                        return gettext('Built-In');
                }

                // Should not happen...
                return 'unknown';
            },
        },
    ],

    store: {
        type: 'diff',
        autoDestroy: true,
        autoDestroyRstore: true,
        rstore: {
            type: 'update',
            storeid: 'proxmox-notification-endpoints',
            model: 'proxmox-notification-endpoints',
            autoStart: true,
        },
        sorters: 'name',
    },

    initComponent: function () {
        let me = this;

        if (!me.baseUrl) {
            throw 'baseUrl is not set!';
        }

        let menuItems = [];
        for (const [endpointType, config] of Object.entries(
            Proxmox.Schema.notificationEndpointTypes,
        ).sort()) {
            menuItems.push({
                text: config.name,
                iconCls: 'fa fa-fw ' + (config.iconCls || 'fa-bell-o'),
                handler: () => me.controller.openEditWindow(endpointType),
            });
        }

        Ext.apply(me, {
            tbar: [
                {
                    text: gettext('Add'),
                    menu: menuItems,
                },
                {
                    xtype: 'proxmoxButton',
                    text: gettext('Modify'),
                    handler: 'openEditForSelectedItem',
                    disabled: true,
                },
                {
                    xtype: 'proxmoxStdRemoveButton',
                    callback: 'reload',
                    bind: {
                        text: '{removeButtonText}',
                        customConfirmationMessage: '{removeButtonConfirmMessage}',
                    },
                    getUrl: function (rec) {
                        return `${me.baseUrl}/endpoints/${rec.data.type}/${rec.getId()}`;
                    },
                    enableFn: (rec) => {
                        let origin = rec.get('origin');
                        return origin === 'user-created' || origin === 'modified-builtin';
                    },
                },
                '-',
                {
                    xtype: 'proxmoxButton',
                    text: gettext('Test'),
                    handler: 'testEndpoint',
                    disabled: true,
                },
            ],
        });

        me.callParent();
        me.store.rstore.proxy.setUrl(`/api2/json/${me.baseUrl}/targets`);
    },
});

Ext.define('Proxmox.panel.NotificationMatcherView', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.pmxNotificationMatcherView',

    title: gettext('Notification Matchers'),

    controller: {
        xclass: 'Ext.app.ViewController',

        openEditWindow: function (matcher) {
            let me = this;

            Ext.create('Proxmox.window.NotificationMatcherEdit', {
                baseUrl: me.getView().baseUrl,
                name: matcher,
                autoShow: true,
                listeners: {
                    destroy: () => me.reload(),
                },
            });
        },

        openEditForSelectedItem: function () {
            let me = this;
            let view = me.getView();

            let selection = view.getSelection();
            if (selection.length < 1) {
                return;
            }

            me.openEditWindow(selection[0].data.name);
        },

        reload: function () {
            this.getView().getStore().rstore.load();
            this.getView().setSelection(null);
        },
    },

    viewModel: {
        type: 'pmxNotificationConfigPanel',
    },

    bind: {
        selection: '{selection}',
    },

    listeners: {
        itemdblclick: 'openEditForSelectedItem',
        activate: 'reload',
    },

    emptyText: gettext('No notification matchers configured'),

    columns: [
        {
            dataIndex: 'disable',
            text: gettext('Enable'),
            renderer: (disable) => Proxmox.Utils.renderEnabledIcon(!disable),
            align: 'center',
        },
        {
            dataIndex: 'name',
            text: gettext('Matcher Name'),
            renderer: Ext.String.htmlEncode,
            flex: 1,
        },
        {
            dataIndex: 'comment',
            text: gettext('Comment'),
            renderer: Ext.String.htmlEncode,
            flex: 2,
        },
        {
            dataIndex: 'origin',
            text: gettext('Origin'),
            renderer: (origin) => {
                switch (origin) {
                    case 'user-created':
                        return gettext('Custom');
                    case 'modified-builtin':
                        return gettext('Built-In (modified)');
                    case 'builtin':
                        return gettext('Built-In');
                }

                // Should not happen...
                return 'unknown';
            },
        },
    ],

    store: {
        type: 'diff',
        autoDestroy: true,
        autoDestroyRstore: true,
        rstore: {
            type: 'update',
            storeid: 'proxmox-notification-matchers',
            model: 'proxmox-notification-matchers',
            autoStart: true,
        },
        sorters: 'name',
    },

    initComponent: function () {
        let me = this;

        if (!me.baseUrl) {
            throw 'baseUrl is not set!';
        }

        Ext.apply(me, {
            tbar: [
                {
                    xtype: 'proxmoxButton',
                    text: gettext('Add'),
                    handler: () => me.getController().openEditWindow(),
                    selModel: false,
                },
                {
                    xtype: 'proxmoxButton',
                    text: gettext('Modify'),
                    handler: 'openEditForSelectedItem',
                    disabled: true,
                },
                {
                    xtype: 'proxmoxStdRemoveButton',
                    callback: 'reload',
                    bind: {
                        text: '{removeButtonText}',
                        customConfirmationMessage: '{removeButtonConfirmMessage}',
                    },
                    baseurl: `${me.baseUrl}/matchers`,
                    enableFn: (rec) => {
                        let origin = rec.get('origin');
                        return origin === 'user-created' || origin === 'modified-builtin';
                    },
                },
            ],
        });

        me.callParent();
        me.store.rstore.proxy.setUrl(`/api2/json/${me.baseUrl}/matchers`);
    },
});
/*
 * Display log entries in a panel with scrollbar
 * The log entries are automatically refreshed via a background task,
 * with newest entries coming at the bottom
 */
Ext.define('Proxmox.panel.JournalView', {
    extend: 'Ext.panel.Panel',
    xtype: 'proxmoxJournalView',

    numEntries: 500,
    lineHeight: 16,

    scrollToEnd: true,

    controller: {
        xclass: 'Ext.app.ViewController',

        updateParams: function () {
            let me = this;
            let viewModel = me.getViewModel();
            let since = viewModel.get('since');
            let until = viewModel.get('until');

            since.setHours(0, 0, 0, 0);
            until.setHours(0, 0, 0, 0);
            until.setDate(until.getDate() + 1);

            me.getView().loadTask.delay(200, undefined, undefined, [
                false,
                false,
                Ext.Date.format(since, 'U'),
                Ext.Date.format(until, 'U'),
            ]);
        },

        scrollPosBottom: function () {
            let view = this.getView();
            let pos = view.getScrollY();
            let maxPos = view.getScrollable().getMaxPosition().y;
            return maxPos - pos;
        },

        scrollPosTop: function () {
            let view = this.getView();
            return view.getScrollY();
        },

        updateScroll: function (livemode, num, scrollPos, scrollPosTop) {
            let me = this;
            let view = me.getView();

            let scrollX = view.getScrollX() ?? 0;
            if (!livemode) {
                setTimeout(function () {
                    view.scrollTo(0, 0);
                }, 10);
            } else if (view.scrollToEnd && scrollPos <= 5) {
                setTimeout(function () {
                    view.scrollTo(scrollX, Infinity);
                }, 10);
            } else if (!view.scrollToEnd && scrollPosTop < 20 * view.lineHeight) {
                setTimeout(function () {
                    view.scrollTo(scrollX, num * view.lineHeight + scrollPosTop);
                }, 10);
            }
        },

        updateView: function (lines, livemode, top) {
            let me = this;
            let view = me.getView();
            let viewmodel = me.getViewModel();
            if (!viewmodel || viewmodel.get('livemode') !== livemode) {
                return; // we switched mode, do not update the content
            }
            let contentEl = me.lookup('content');

            // save old scrollpositions
            let scrollPos = me.scrollPosBottom();
            let scrollPosTop = me.scrollPosTop();

            let newend = lines.shift();
            let newstart = lines.pop();

            let num = lines.length;
            let text = lines.map(Ext.htmlEncode).join('<br>');

            let contentChanged = true;

            if (!livemode) {
                if (num) {
                    view.content = text;
                } else {
                    view.content = 'nothing logged or no timespan selected';
                }
            } else {
                // update content
                if (top && num) {
                    view.content = view.content ? text + '<br>' + view.content : text;
                } else if (!top && num) {
                    view.content = view.content ? view.content + '<br>' + text : text;
                } else {
                    contentChanged = false;
                }

                // update cursors
                if (!top || !view.startcursor) {
                    view.startcursor = newstart;
                }

                if (top || !view.endcursor) {
                    view.endcursor = newend;
                }
            }

            if (contentChanged) {
                contentEl.update(view.content);
            }

            me.updateScroll(livemode, num, scrollPos, scrollPosTop);
        },

        doLoad: function (livemode, top, since, until) {
            let me = this;
            if (me.running) {
                me.requested = true;
                return;
            }
            me.running = true;
            let view = me.getView();
            let params = {
                lastentries: view.numEntries || 500,
            };
            if (livemode) {
                if (!top && view.startcursor) {
                    params = {
                        startcursor: view.startcursor,
                    };
                } else if (view.endcursor) {
                    params.endcursor = view.endcursor;
                }
            } else {
                params = {
                    since: since,
                    until: until,
                };
            }
            Proxmox.Utils.API2Request({
                url: view.url,
                params: params,
                waitMsgTarget: !livemode ? view : undefined,
                method: 'GET',
                success: function (response) {
                    if (me.isDestroyed) {
                        return;
                    }
                    Proxmox.Utils.setErrorMask(me, false);
                    let lines = response.result.data;
                    me.updateView(lines, livemode, top);
                    me.running = false;
                    if (me.requested) {
                        me.requested = false;
                        view.loadTask.delay(200);
                    }
                },
                failure: function (response) {
                    let msg = response.htmlStatus;
                    Proxmox.Utils.setErrorMask(me, msg);
                    me.running = false;
                    if (me.requested) {
                        me.requested = false;
                        view.loadTask.delay(200);
                    }
                },
            });
        },

        onScroll: function (x, y) {
            let me = this;
            let view = me.getView();
            let viewmodel = me.getViewModel();
            let livemode = viewmodel.get('livemode');
            if (!livemode) {
                return;
            }

            if (me.scrollPosTop() < 20 * view.lineHeight) {
                view.scrollToEnd = false;
                view.loadTask.delay(200, undefined, undefined, [true, true]);
            } else if (me.scrollPosBottom() <= 5) {
                view.scrollToEnd = true;
            }
        },

        init: function (view) {
            let me = this;

            if (!view.url) {
                throw 'no url specified';
            }

            let viewmodel = me.getViewModel();
            let viewModel = this.getViewModel();
            let since = new Date();
            since.setDate(since.getDate() - 3);
            viewModel.set('until', new Date());
            viewModel.set('since', since);
            me.lookup('content').setStyle('line-height', view.lineHeight + 'px');

            view.loadTask = new Ext.util.DelayedTask(me.doLoad, me, [true, false]);

            view.task = Ext.TaskManager.start({
                run: function () {
                    if (!view.isVisible() || !view.scrollToEnd || !viewmodel.get('livemode')) {
                        return;
                    }

                    if (me.scrollPosBottom() <= 5) {
                        view.loadTask.delay(200, undefined, undefined, [true, false]);
                    }
                },
                interval: 1000,
            });
        },

        onLiveMode: function () {
            let me = this;
            let view = me.getView();
            delete view.startcursor;
            delete view.endcursor;
            delete view.content;
            me.getViewModel().set('livemode', true);
            view.scrollToEnd = true;
            me.updateView([], true, false);
        },

        onTimespan: function () {
            let me = this;
            me.getViewModel().set('livemode', false);
            me.updateView([], false);
        },
    },

    onDestroy: function () {
        let me = this;
        me.loadTask.cancel();
        Ext.TaskManager.stop(me.task);
        delete me.content;
    },

    // for user to initiate a load from outside
    requestUpdate: function () {
        let me = this;
        me.loadTask.delay(200);
    },

    viewModel: {
        data: {
            livemode: true,
            until: null,
            since: null,
        },
    },

    layout: 'auto',
    bodyPadding: 5,
    scrollable: {
        x: 'auto',
        y: 'auto',
        listeners: {
            // we have to have this here, since we cannot listen to events
            // of the scroller in the viewcontroller (extjs bug?), nor does
            // the panel have a 'scroll' event'
            scroll: {
                fn: function (scroller, x, y) {
                    let controller = this.component.getController();
                    if (controller) {
                        // on destroy, controller can be gone
                        controller.onScroll(x, y);
                    }
                },
                buffer: 200,
            },
        },
    },

    tbar: {
        items: [
            '->',
            {
                xtype: 'segmentedbutton',
                items: [
                    {
                        text: gettext('Live Mode'),
                        bind: {
                            pressed: '{livemode}',
                        },
                        handler: 'onLiveMode',
                    },
                    {
                        text: gettext('Select Timespan'),
                        bind: {
                            pressed: '{!livemode}',
                        },
                        handler: 'onTimespan',
                    },
                ],
            },
            {
                xtype: 'box',
                bind: { disabled: '{livemode}' },
                autoEl: { cn: gettext('Since') + ':' },
            },
            {
                xtype: 'datefield',
                name: 'since_date',
                reference: 'since',
                format: 'Y-m-d',
                bind: {
                    disabled: '{livemode}',
                    value: '{since}',
                    maxValue: '{until}',
                },
            },
            {
                xtype: 'box',
                bind: { disabled: '{livemode}' },
                autoEl: { cn: gettext('Until') + ':' },
            },
            {
                xtype: 'datefield',
                name: 'until_date',
                reference: 'until',
                format: 'Y-m-d',
                bind: {
                    disabled: '{livemode}',
                    value: '{until}',
                    minValue: '{since}',
                },
            },
            {
                xtype: 'button',
                text: 'Update',
                reference: 'updateBtn',
                handler: 'updateParams',
                bind: {
                    disabled: '{livemode}',
                },
            },
        ],
    },

    items: [
        {
            xtype: 'box',
            reference: 'content',
            style: {
                font: 'normal 11px tahoma, arial, verdana, sans-serif',
                'white-space': 'pre',
            },
        },
    ],
});
Ext.define('pmx-permissions', {
    extend: 'Ext.data.TreeModel',
    fields: [
        'text',
        'type',
        {
            type: 'boolean',
            name: 'propagate',
        },
    ],
});

Ext.define('Proxmox.panel.PermissionViewPanel', {
    extend: 'Ext.tree.Panel',
    xtype: 'proxmoxPermissionViewPanel',

    scrollable: true,
    layout: 'fit',
    rootVisible: false,
    animate: false,
    sortableColumns: false,

    auth_id_name: 'userid',
    auth_id: undefined,

    columns: [
        {
            xtype: 'treecolumn',
            header: gettext('Path') + '/' + gettext('Permission'),
            dataIndex: 'text',
            flex: 6,
        },
        {
            header: gettext('Propagate'),
            dataIndex: 'propagate',
            flex: 1,
            renderer: function (value) {
                if (Ext.isDefined(value)) {
                    return Proxmox.Utils.format_boolean(value);
                }
                return '';
            },
        },
    ],

    initComponent: function () {
        let me = this;

        Proxmox.Utils.API2Request({
            url:
                '/access/permissions?' +
                encodeURIComponent(me.auth_id_name) +
                '=' +
                encodeURIComponent(me.auth_id),
            method: 'GET',
            failure: function (response, opts) {
                Proxmox.Utils.setErrorMask(me, response.htmlStatus);
            },
            success: function (response, opts) {
                Proxmox.Utils.setErrorMask(me, false);
                let result = Ext.decode(response.responseText);
                let data = result.data || {};

                let root = {
                    name: '__root',
                    expanded: true,
                    children: [],
                };
                let idhash = {
                    '/': {
                        children: [],
                        text: '/',
                        type: 'path',
                    },
                };
                Ext.Object.each(data, function (path, perms) {
                    let path_item = {
                        text: path,
                        type: 'path',
                        children: [],
                    };
                    Ext.Object.each(perms, function (perm, propagate) {
                        let perm_item = {
                            text: perm,
                            type: 'perm',
                            propagate: propagate === 1 || propagate === true,
                            iconCls: 'fa fa-fw fa-unlock',
                            leaf: true,
                        };
                        path_item.children.push(perm_item);
                        path_item.expandable = true;
                    });
                    idhash[path] = path_item;
                });

                Ext.Object.each(idhash, function (path, item) {
                    let parent_item = idhash['/'];
                    if (path === '/') {
                        parent_item = root;
                        item.expanded = true;
                    } else {
                        let split_path = path.split('/');
                        while (split_path.pop()) {
                            let parent_path = split_path.join('/');
                            if (idhash[parent_path]) {
                                parent_item = idhash[parent_path];
                                break;
                            }
                        }
                    }
                    parent_item.children.push(item);
                });

                me.setRootNode(root);
            },
        });

        me.callParent();

        me.store.sorters.add(
            new Ext.util.Sorter({
                sorterFn: function (rec1, rec2) {
                    let v1 = rec1.data.text,
                        v2 = rec2.data.text;
                    if (rec1.data.type !== rec2.data.type) {
                        v2 = rec1.data.type;
                        v1 = rec2.data.type;
                    }
                    if (v1 > v2) {
                        return 1;
                    } else if (v1 < v2) {
                        return -1;
                    }
                    return 0;
                },
            }),
        );
    },
});

Ext.define('Proxmox.PermissionView', {
    extend: 'Ext.window.Window',
    alias: 'widget.userShowPermissionWindow',
    mixins: ['Proxmox.Mixin.CBind'],

    scrollable: true,
    width: 800,
    height: 600,
    layout: 'fit',
    cbind: {
        title: (get) =>
            Ext.String.htmlEncode(get('auth_id')) + ` - ${gettext('Granted Permissions')}`,
    },
    items: [
        {
            xtype: 'proxmoxPermissionViewPanel',
            cbind: {
                auth_id: '{auth_id}',
                auth_id_name: '{auth_id_name}',
            },
        },
    ],
});
Ext.define('Proxmox.panel.PruneInputPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxPruneInputPanel',
    mixins: ['Proxmox.Mixin.CBind'],

    // set on use for now
    //onlineHelp: 'maintenance_pruning',

    keepLastEmptyText: '',

    cbindData: function () {
        let me = this;
        me.isCreate = !!me.isCreate;
        return {};
    },

    column1: [
        {
            xtype: 'pmxPruneKeepField',
            name: 'keep-last',
            fieldLabel: gettext('Keep Last'),
            cbind: {
                deleteEmpty: '{!isCreate}',
                emptyText: '{keepLastEmptyText}',
            },
        },
        {
            xtype: 'pmxPruneKeepField',
            name: 'keep-daily',
            fieldLabel: gettext('Keep Daily'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
        {
            xtype: 'pmxPruneKeepField',
            name: 'keep-monthly',
            fieldLabel: gettext('Keep Monthly'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],
    column2: [
        {
            xtype: 'pmxPruneKeepField',
            fieldLabel: gettext('Keep Hourly'),
            name: 'keep-hourly',
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
        {
            xtype: 'pmxPruneKeepField',
            name: 'keep-weekly',
            fieldLabel: gettext('Keep Weekly'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
        {
            xtype: 'pmxPruneKeepField',
            name: 'keep-yearly',
            fieldLabel: gettext('Keep Yearly'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],
});
// override the download server url globally, for privacy reasons
Ext.draw.Container.prototype.defaultDownloadServerUrl = '-';

Ext.define('Proxmox.chart.axis.segmenter.NumericBase2', {
    extend: 'Ext.chart.axis.segmenter.Numeric',
    alias: 'segmenter.numericBase2',

    // derived from the original numeric segmenter but using 2 instead of 10 as base
    preferredStep: function (min, estStepSize) {
        // Getting an order of magnitude of the estStepSize with a common logarithm.
        let order = Math.floor(Math.log2(estStepSize));
        let scale = Math.pow(2, order);

        estStepSize /= scale;

        // FIXME: below is not useful when using base 2 instead of base 10, we could
        // just directly set estStepSize to 2
        if (estStepSize <= 1) {
            estStepSize = 1;
        } else if (estStepSize < 2) {
            estStepSize = 2;
        }
        return {
            unit: {
                // When passed estStepSize is less than 1, its order of magnitude
                // is equal to -number_of_leading_zeros in the estStepSize.
                fixes: -order, // Number of fractional digits.
                scale: scale,
            },
            step: estStepSize,
        };
    },

    /**
     * Wraps the provided estimated step size of a range without altering it into a step size object.
     *
     * @param {*} min The start point of range.
     * @param {*} estStepSize The estimated step size.
     * @return {Object} Return the step size by an object of step x unit.
     * @return {Number} return.step The step count of units.
     * @return {Object} return.unit The unit.
     */
    // derived from the original numeric segmenter but using 2 instead of 10 as base
    exactStep: function (min, estStepSize) {
        let order = Math.floor(Math.log2(estStepSize));
        let scale = Math.pow(2, order);

        return {
            unit: {
                // add one decimal point if estStepSize is not a multiple of scale
                fixes: -order + (estStepSize % scale === 0 ? 0 : 1),
                scale: 1,
            },
            step: estStepSize,
        };
    },
});

Ext.define('Proxmox.widget.RRDChart', {
    extend: 'Ext.chart.CartesianChart',
    alias: 'widget.proxmoxRRDChart',

    unit: undefined, // bytes, bytespersecond, percent

    powerOfTwo: false,

    // set to empty string to suppress warning in debug mode
    downloadServerUrl: '-',

    onLegendChange: Ext.emptyFn, // empty dummy function so we can add listener for legend events when needed

    controller: {
        xclass: 'Ext.app.ViewController',

        init: function (view) {
            this.powerOfTwo = view.powerOfTwo;
        },

        convertToUnits: function (value) {
            let units = ['', 'k', 'M', 'G', 'T', 'P'];
            let si = 0;
            let format = '0.##';
            if (value < 0.1) {
                format += '#';
            }
            const baseValue = this.powerOfTwo ? 1024 : 1000;
            while (value >= baseValue && si < units.length - 1) {
                value = value / baseValue;
                si++;
            }

            // javascript floating point weirdness
            value = Ext.Number.correctFloat(value);

            // limit decimal points
            value = Ext.util.Format.number(value, format);

            let unit = units[si];
            if (unit && this.powerOfTwo) {
                unit += 'i';
            }

            return `${value.toString()} ${unit}`;
        },

        leftAxisRenderer: function (axis, label, layoutContext) {
            let me = this;
            return me.convertToUnits(label);
        },

        onSeriesTooltipRender: function (tooltip, record, item) {
            let view = this.getView();

            let suffix = '';
            if (view.unit === 'percent') {
                suffix = '%';
            } else if (view.unit === 'bytes') {
                suffix = 'B';
            } else if (view.unit === 'bytespersecond') {
                suffix = 'B/s';
            }

            let value = record.get(item.field);
            if (value === null) {
                tooltip.setHtml(gettext('No Data'));
            } else {
                let prefix = item.field;
                if (view.fieldTitles && view.fieldTitles[view.fields.indexOf(item.field)]) {
                    prefix = view.fieldTitles[view.fields.indexOf(item.field)];
                } else {
                    // If series is passed in directly, we don't have fieldTitles set. The title property can be a
                    // single string for a line series, or an array for an area/stacked series.
                    for (const field of view.fields) {
                        if (Array.isArray(field.yField)) {
                            if (field.title && field.title[field.yField.indexOf(item.field)]) {
                                prefix = field.title[field.yField.indexOf(item.field)];
                                break;
                            }
                        } else if (field.yField === item.field && field.title) {
                            prefix = field.title;
                            break;
                        }
                    }
                }

                let v = this.convertToUnits(value);
                let t = new Date(record.get('time'));
                tooltip.setHtml(`${prefix}: ${v}${suffix}<br>${t}`);
            }
        },

        onAfterAnimation: function (chart, eopts) {
            if (!chart.header || !chart.header.tools) {
                return;
            }
            // if the undo button is disabled, disable our tool
            let ourUndoZoomButton = chart.lookupReference('undoButton');
            let undoButton = chart.interactions[0].getUndoButton();
            ourUndoZoomButton.setDisabled(undoButton.isDisabled());
        },
    },

    width: 770,
    height: 300,
    animation: false,
    interactions: [
        {
            type: 'crosszoom',
        },
    ],
    legend: {
        type: 'dom',
        padding: 0,
        style: 'cursor: pointer;',
    },
    axes: [
        {
            type: 'numeric',
            position: 'left',
            grid: true,
            renderer: 'leftAxisRenderer',
            minimum: 0,
        },
        {
            type: 'time',
            position: 'bottom',
            grid: true,
            fields: ['time'],
        },
    ],
    listeners: {
        redraw: {
            fn: 'onAfterAnimation',
            options: {
                buffer: 500,
            },
        },
    },

    touchAction: {
        panX: true,
        panY: true,
    },

    constructor: function (config) {
        let me = this;

        let segmenter = config.powerOfTwo ? 'numericBase2' : 'numeric';

        let axes = config.axes ?? me.config.axes ?? [];
        for (const axis of axes) {
            if (
                axis.type === 'numeric' &&
                (axis.position === 'left' || axis.position === 'right')
            ) {
                axis.segmenter = segmenter;
            }
        }

        me.callParent([config]);
    },

    checkThemeColors: function () {
        let me = this;
        let rootStyle = getComputedStyle(document.documentElement);

        // get colors
        let background = rootStyle.getPropertyValue('--pwt-panel-background').trim() || '#ffffff';
        let text = rootStyle.getPropertyValue('--pwt-text-color').trim() || '#000000';
        let primary = rootStyle.getPropertyValue('--pwt-chart-primary').trim() || '#000000';
        let gridStroke = rootStyle.getPropertyValue('--pwt-chart-grid-stroke').trim() || '#dddddd';

        // set the colors
        me.setBackground(background);
        me.axes.forEach((axis) => {
            axis.setLabel({ color: text });
            axis.setTitle({ color: text });
            axis.setStyle({ strokeStyle: primary });
            axis.setGrid({ stroke: gridStroke });
        });
        me.redraw();
    },

    initComponent: function () {
        let me = this;

        if (!me.store) {
            throw 'cannot work without store';
        }

        if (!me.fields) {
            throw 'cannot work without fields';
        }

        me.callParent();

        // add correct label for left axis
        let axisTitle = '';
        if (me.unit === 'percent') {
            axisTitle = '%';
        } else if (me.unit === 'bytes') {
            axisTitle = 'Bytes';
        } else if (me.unit === 'bytespersecond') {
            axisTitle = 'Bytes/s';
        } else if (me.fieldTitles && me.fieldTitles.length === 1) {
            axisTitle = me.fieldTitles[0];
        } else if (me.fields.length === 1) {
            axisTitle = me.fields[0];
        }

        me.axes[0].setTitle(axisTitle);

        me.updateHeader();

        if (me.header && me.legend) {
            // event itemclick is not documented for legend, but found it by printing all events happening
            me.legend.addListener('itemclick', me.onLegendChange);
            me.header.padding = '4 9 4';
            me.header.add(me.legend);
            me.legend = undefined;
        }

        if (!me.noTool) {
            me.addTool({
                type: 'minus',
                disabled: true,
                reference: 'undoButton',
                tooltip: gettext('Undo Zoom'),
                handler: function () {
                    let undoButton = me.interactions[0].getUndoButton();
                    if (undoButton.handler) {
                        undoButton.handler();
                    }
                },
            });
        }

        // add a series for each field we get
        me.fields.forEach(function (item, index) {
            let yField;
            let title;
            let object;

            if (typeof item === 'object') {
                object = item;
            } else {
                yField = item;
                title = item;
                if (me.fieldTitles && me.fieldTitles[index]) {
                    title = me.fieldTitles[index];
                }
            }
            me.addSeries(
                Ext.apply(
                    {
                        type: 'line',
                        xField: 'time',
                        yField,
                        title,
                        fill: true,
                        style: {
                            lineWidth: 1.5,
                            opacity: 0.6,
                        },
                        marker: {
                            opacity: 0,
                            scaling: 0.01,
                        },
                        highlightCfg: {
                            opacity: 1,
                            scaling: 1.5,
                        },
                        tooltip: {
                            trackMouse: true,
                            renderer: 'onSeriesTooltipRender',
                        },
                    },
                    object ?? me.seriesConfig,
                ),
            );
        });

        // enable animation after the store is loaded
        me.store.onAfter(
            'load',
            function () {
                me.setAnimation({
                    duration: 200,
                    easing: 'easeIn',
                });
            },
            this,
            { single: true },
        );

        me.checkThemeColors();

        // switch colors on media query changes
        me.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        me.themeListener = (e) => {
            me.checkThemeColors();
        };
        me.mediaQueryList.addEventListener('change', me.themeListener);
    },

    doDestroy: function () {
        let me = this;

        me.mediaQueryList.removeEventListener('change', me.themeListener);

        me.callParent();
    },
});
Ext.define('Proxmox.panel.GaugeWidget', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.proxmoxGauge',

    defaults: {
        style: {
            'text-align': 'center',
        },
    },
    items: [
        {
            xtype: 'box',
            itemId: 'title',
            data: {
                title: '',
            },
            tpl: '<h3>{title}</h3>',
        },
        {
            xtype: 'polar',
            height: 120,
            border: false,
            // set to '-' to suppress warning in debug mode
            downloadServerUrl: '-',
            itemId: 'chart',
            series: [
                {
                    type: 'gauge',
                    value: 0,
                    colors: ['#f5f5f5'],
                    sectors: [0],
                    donut: 90,
                    needleLength: 100,
                    totalAngle: Math.PI,
                },
            ],
            sprites: [
                {
                    id: 'valueSprite',
                    type: 'text',
                    text: '',
                    textAlign: 'center',
                    textBaseline: 'bottom',
                    x: 125,
                    y: 110,
                    fontSize: 30,
                },
            ],
        },
        {
            xtype: 'box',
            itemId: 'text',
        },
    ],

    header: false,
    border: false,

    warningThreshold: 0.6,
    criticalThreshold: 0.9,
    warningColor: '#fc0',
    criticalColor: '#FF6C59',
    defaultColor: '#c2ddf2',
    backgroundColor: '#f5f5f5',

    initialValue: 0,

    checkThemeColors: function () {
        let me = this;
        let rootStyle = getComputedStyle(document.documentElement);

        // get colors
        let panelBg = rootStyle.getPropertyValue('--pwt-panel-background').trim() || '#ffffff';
        let textColor = rootStyle.getPropertyValue('--pwt-text-color').trim() || '#000000';
        me.defaultColor = rootStyle.getPropertyValue('--pwt-gauge-default').trim() || '#c2ddf2';
        me.criticalColor = rootStyle.getPropertyValue('--pwt-gauge-crit').trim() || '#ff6c59';
        me.warningColor = rootStyle.getPropertyValue('--pwt-gauge-warn').trim() || '#fc0';
        me.backgroundColor = rootStyle.getPropertyValue('--pwt-gauge-back').trim() || '#f5f5f5';

        // set gauge colors
        let value = me.chart.series[0].getValue() / 100;

        let color = me.defaultColor;

        if (value >= me.criticalThreshold) {
            color = me.criticalColor;
        } else if (value >= me.warningThreshold) {
            color = me.warningColor;
        }

        me.chart.series[0].setColors([color, me.backgroundColor]);

        // set text and background colors
        me.chart.setBackground(panelBg);
        me.valueSprite.setAttributes({ fillStyle: textColor }, true);
        me.chart.redraw();
    },

    updateValue: function (value, text) {
        let me = this;
        let color = me.defaultColor;
        let attr = {};

        if (value >= me.criticalThreshold) {
            color = me.criticalColor;
        } else if (value >= me.warningThreshold) {
            color = me.warningColor;
        }

        me.chart.series[0].setColors([color, me.backgroundColor]);
        me.chart.series[0].setValue(value * 100);

        me.valueSprite.setText(' ' + (value * 100).toFixed(0) + '%');
        attr.x = me.chart.getWidth() / 2;
        attr.y = me.chart.getHeight() - 20;
        if (me.spriteFontSize) {
            attr.fontSize = me.spriteFontSize;
        }
        me.valueSprite.setAttributes(attr, true);

        if (text !== undefined) {
            me.text.setHtml(text);
        }
    },

    initComponent: function () {
        let me = this;

        me.callParent();

        if (me.title) {
            me.getComponent('title').update({ title: me.title });
        }
        me.text = me.getComponent('text');
        me.chart = me.getComponent('chart');
        me.valueSprite = me.chart.getSurface('chart').get('valueSprite');

        me.checkThemeColors();

        // switch colors on media query changes
        me.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        me.themeListener = (e) => {
            me.checkThemeColors();
        };
        me.mediaQueryList.addEventListener('change', me.themeListener);
    },

    doDestroy: function () {
        let me = this;

        me.mediaQueryList.removeEventListener('change', me.themeListener);

        me.callParent();
    },
});
Ext.define('Proxmox.panel.GotifyEditPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxGotifyEditPanel',
    mixins: ['Proxmox.Mixin.CBind'],
    onlineHelp: 'notification_targets_gotify',

    type: 'gotify',

    items: [
        {
            xtype: 'pmxDisplayEditField',
            name: 'name',
            cbind: {
                value: '{name}',
                editable: '{isCreate}',
            },
            fieldLabel: gettext('Endpoint Name'),
            allowBlank: false,
        },
        {
            xtype: 'proxmoxcheckbox',
            name: 'enable',
            fieldLabel: gettext('Enable'),
            allowBlank: false,
            checked: true,
        },
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('Server URL'),
            name: 'server',
            allowBlank: false,
        },
        {
            xtype: 'proxmoxtextfield',
            inputType: 'password',
            fieldLabel: gettext('API Token'),
            name: 'token',
            cbind: {
                emptyText: (get) => (!get('isCreate') ? gettext('Unchanged') : ''),
                allowBlank: '{!isCreate}',
            },
        },
        {
            xtype: 'proxmoxtextfield',
            name: 'comment',
            fieldLabel: gettext('Comment'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],

    onSetValues: (values) => {
        values.enable = !values.disable;

        delete values.disable;
        return values;
    },

    onGetValues: function (values) {
        let me = this;

        if (values.enable) {
            if (!me.isCreate) {
                Proxmox.Utils.assemble_field_data(values, { delete: 'disable' });
            }
        } else {
            values.disable = 1;
        }

        delete values.enable;

        return values;
    },
});
Ext.define('Proxmox.panel.Certificates', {
    extend: 'Ext.grid.Panel',
    xtype: 'pmxCertificates',

    // array of { name, id (=filename), url, deletable, reloadUi }
    uploadButtons: undefined,

    // The /info path for the current node.
    infoUrl: undefined,

    columns: [
        {
            header: gettext('File'),
            width: 150,
            dataIndex: 'filename',
        },
        {
            header: gettext('Issuer'),
            flex: 1,
            dataIndex: 'issuer',
        },
        {
            header: gettext('Subject'),
            flex: 1,
            dataIndex: 'subject',
        },
        {
            header: gettext('Public Key Algorithm'),
            flex: 1,
            dataIndex: 'public-key-type',
            hidden: true,
        },
        {
            header: gettext('Public Key Size'),
            flex: 1,
            dataIndex: 'public-key-bits',
            hidden: true,
        },
        {
            header: gettext('Valid Since'),
            width: 150,
            dataIndex: 'notbefore',
            renderer: Proxmox.Utils.render_timestamp,
        },
        {
            header: gettext('Expires'),
            width: 150,
            dataIndex: 'notafter',
            renderer: Proxmox.Utils.render_timestamp,
        },
        {
            header: gettext('Subject Alternative Names'),
            flex: 1,
            dataIndex: 'san',
            renderer: Proxmox.Utils.render_san,
        },
        {
            header: gettext('Fingerprint'),
            dataIndex: 'fingerprint',
            hidden: true,
        },
        {
            header: gettext('PEM'),
            dataIndex: 'pem',
            hidden: true,
        },
    ],

    reload: function () {
        let me = this;
        me.rstore.load();
    },

    delete_certificate: function () {
        let me = this;

        let rec = me.selModel.getSelection()[0];
        if (!rec) {
            return;
        }

        let cert = me.certById[rec.id];
        let url = cert.url;
        Proxmox.Utils.API2Request({
            url: `/api2/extjs/${url}?restart=1`,
            method: 'DELETE',
            success: function (response, opt) {
                if (cert.reloadUi) {
                    Ext.getBody().mask(
                        gettext(
                            'API server will be restarted to use new certificates, please reload web-interface!',
                        ),
                        ['pve-static-mask'],
                    );
                    // try to reload after 10 seconds automatically
                    Ext.defer(() => window.location.reload(true), 10000);
                }
            },
            failure: function (response, opt) {
                Ext.Msg.alert(gettext('Error'), response.htmlStatus);
            },
        });
    },

    controller: {
        xclass: 'Ext.app.ViewController',
        view_certificate: function () {
            let me = this;
            let view = me.getView();

            let selection = view.getSelection();
            if (!selection || selection.length < 1) {
                return;
            }
            let win = Ext.create('Proxmox.window.CertificateViewer', {
                cert: selection[0].data.filename,
                url: `/api2/extjs/${view.infoUrl}`,
            });
            win.show();
        },
    },

    listeners: {
        itemdblclick: 'view_certificate',
    },

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            // only used for the store name
            me.nodename = '_all';
        }

        if (!me.uploadButtons) {
            throw 'no upload buttons defined';
        }

        if (!me.infoUrl) {
            throw 'no certificate store url given';
        }

        me.rstore = Ext.create('Proxmox.data.UpdateStore', {
            storeid: 'certs-' + me.nodename,
            model: 'proxmox-certificate',
            proxy: {
                type: 'proxmox',
                url: `/api2/extjs/${me.infoUrl}`,
            },
        });

        me.store = {
            type: 'diff',
            rstore: me.rstore,
        };

        let tbar = [];

        me.deletableCertIds = {};
        me.certById = {};
        if (me.uploadButtons.length === 1) {
            let cert = me.uploadButtons[0];

            if (!cert.url) {
                throw 'missing certificate url';
            }

            me.certById[cert.id] = cert;

            if (cert.deletable) {
                me.deletableCertIds[cert.id] = true;
            }

            tbar.push({
                xtype: 'button',
                text: gettext('Upload Custom Certificate'),
                handler: function () {
                    let grid = this.up('grid');
                    let win = Ext.create('Proxmox.window.CertificateUpload', {
                        url: `/api2/extjs/${cert.url}`,
                        reloadUi: cert.reloadUi,
                    });
                    win.show();
                    win.on('destroy', grid.reload, grid);
                },
            });
        } else {
            let items = [];

            me.selModel = Ext.create('Ext.selection.RowModel', {});

            for (const cert of me.uploadButtons) {
                if (!cert.id) {
                    throw 'missing id in certificate entry';
                }

                if (!cert.url) {
                    throw 'missing url in certificate entry';
                }

                if (!cert.name) {
                    throw 'missing name in certificate entry';
                }

                me.certById[cert.id] = cert;

                if (cert.deletable) {
                    me.deletableCertIds[cert.id] = true;
                }

                items.push({
                    text: Ext.String.format('Upload {0} Certificate', cert.name),
                    handler: function () {
                        let grid = this.up('grid');
                        let win = Ext.create('Proxmox.window.CertificateUpload', {
                            url: `/api2/extjs/${cert.url}`,
                            reloadUi: cert.reloadUi,
                        });
                        win.show();
                        win.on('destroy', grid.reload, grid);
                    },
                });
            }

            tbar.push({
                text: gettext('Upload Custom Certificate'),
                menu: {
                    xtype: 'menu',
                    items,
                },
            });
        }

        tbar.push(
            {
                xtype: 'proxmoxButton',
                text: gettext('Delete Custom Certificate'),
                confirmMsg: (rec) => {
                    let cert = me.certById[rec.id];
                    if (cert.name) {
                        return Ext.String.format(
                            gettext('Are you sure you want to remove the certificate used for {0}'),
                            cert.name,
                        );
                    }
                    return gettext('Are you sure you want to remove the certificate');
                },
                callback: () => me.reload(),
                selModel: me.selModel,
                disabled: true,
                enableFn: (rec) => !!me.deletableCertIds[rec.id],
                handler: function () {
                    me.delete_certificate();
                },
            },
            '-',
            {
                xtype: 'proxmoxButton',
                itemId: 'viewbtn',
                disabled: true,
                text: gettext('View Certificate'),
                handler: 'view_certificate',
            },
        );
        Ext.apply(me, { tbar });

        me.callParent();

        me.rstore.startUpdate();
        me.on('destroy', me.rstore.stopUpdate, me.rstore);
    },
});
Ext.define('Proxmox.panel.ACMEAccounts', {
    extend: 'Ext.grid.Panel',
    xtype: 'pmxACMEAccounts',

    title: gettext('Accounts'),

    acmeUrl: undefined,

    controller: {
        xclass: 'Ext.app.ViewController',

        addAccount: function () {
            let me = this;
            let view = me.getView();
            let defaultExists = view.getStore().findExact('name', 'default') !== -1;
            Ext.create('Proxmox.window.ACMEAccountCreate', {
                defaultExists,
                acmeUrl: view.acmeUrl,
                taskDone: function () {
                    me.reload();
                },
            }).show();
        },

        viewAccount: function () {
            let me = this;
            let view = me.getView();
            let selection = view.getSelection();
            if (selection.length < 1) {
                return;
            }
            Ext.create('Proxmox.window.ACMEAccountView', {
                url: `${view.acmeUrl}/account/${selection[0].data.name}`,
            }).show();
        },

        reload: function () {
            let me = this;
            let view = me.getView();
            view.getStore().rstore.load();
        },

        showTaskAndReload: function (options, success, response) {
            let me = this;
            if (!success) {
                return;
            }

            let upid = response.result.data;
            Ext.create('Proxmox.window.TaskProgress', {
                upid,
                taskDone: function () {
                    me.reload();
                },
            }).show();
        },
    },

    minHeight: 150,
    emptyText: gettext('No Accounts configured'),

    columns: [
        {
            dataIndex: 'name',
            text: gettext('Name'),
            renderer: Ext.String.htmlEncode,
            flex: 1,
        },
    ],

    listeners: {
        itemdblclick: 'viewAccount',
    },

    store: {
        type: 'diff',
        autoDestroy: true,
        autoDestroyRstore: true,
        rstore: {
            type: 'update',
            storeid: 'proxmox-acme-accounts',
            model: 'proxmox-acme-accounts',
            autoStart: true,
        },
        sorters: 'name',
    },

    initComponent: function () {
        let me = this;

        if (!me.acmeUrl) {
            throw 'no acmeUrl given';
        }

        Ext.apply(me, {
            tbar: [
                {
                    xtype: 'proxmoxButton',
                    text: gettext('Add'),
                    selModel: false,
                    handler: 'addAccount',
                },
                {
                    xtype: 'proxmoxButton',
                    text: gettext('View'),
                    handler: 'viewAccount',
                    disabled: true,
                },
                {
                    xtype: 'proxmoxStdRemoveButton',
                    baseurl: `${me.acmeUrl}/account`,
                    callback: 'showTaskAndReload',
                },
            ],
        });

        me.callParent();
        me.store.rstore.proxy.setUrl(`/api2/json/${me.acmeUrl}/account`);
    },
});
Ext.define('Proxmox.panel.ACMEPluginView', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.pmxACMEPluginView',

    title: gettext('Challenge Plugins'),
    acmeUrl: undefined,

    controller: {
        xclass: 'Ext.app.ViewController',

        addPlugin: function () {
            let me = this;
            let view = me.getView();
            Ext.create('Proxmox.window.ACMEPluginEdit', {
                acmeUrl: view.acmeUrl,
                url: `${view.acmeUrl}/plugins`,
                isCreate: true,
                apiCallDone: function () {
                    me.reload();
                },
            }).show();
        },

        editPlugin: function () {
            let me = this;
            let view = me.getView();
            let selection = view.getSelection();
            if (selection.length < 1) {
                return;
            }
            let plugin = selection[0].data.plugin;
            Ext.create('Proxmox.window.ACMEPluginEdit', {
                acmeUrl: view.acmeUrl,
                url: `${view.acmeUrl}/plugins/${plugin}`,
                apiCallDone: function () {
                    me.reload();
                },
            }).show();
        },

        reload: function () {
            let me = this;
            let view = me.getView();
            view.getStore().rstore.load();
        },
    },

    minHeight: 150,
    emptyText: gettext('No Plugins configured'),

    columns: [
        {
            dataIndex: 'plugin',
            text: gettext('Plugin'),
            renderer: Ext.String.htmlEncode,
            flex: 1,
        },
        {
            dataIndex: 'api',
            text: 'API',
            renderer: Ext.String.htmlEncode,
            flex: 1,
        },
    ],

    listeners: {
        itemdblclick: 'editPlugin',
    },

    store: {
        type: 'diff',
        autoDestroy: true,
        autoDestroyRstore: true,
        rstore: {
            type: 'update',
            storeid: 'proxmox-acme-plugins',
            model: 'proxmox-acme-plugins',
            autoStart: true,
            filters: (item) => !!item.data.api,
        },
        sorters: 'plugin',
    },

    initComponent: function () {
        let me = this;

        if (!me.acmeUrl) {
            throw 'no acmeUrl given';
        }
        me.url = `${me.acmeUrl}/plugins`;

        Ext.apply(me, {
            tbar: [
                {
                    xtype: 'proxmoxButton',
                    text: gettext('Add'),
                    handler: 'addPlugin',
                    selModel: false,
                },
                {
                    xtype: 'proxmoxButton',
                    text: gettext('Edit'),
                    handler: 'editPlugin',
                    disabled: true,
                },
                {
                    xtype: 'proxmoxStdRemoveButton',
                    callback: 'reload',
                    baseurl: `${me.acmeUrl}/plugins`,
                },
            ],
        });

        me.callParent();

        me.store.rstore.proxy.setUrl(`/api2/json/${me.acmeUrl}/plugins`);
    },
});
Ext.define('proxmox-acme-domains', {
    extend: 'Ext.data.Model',
    fields: ['domain', 'type', 'alias', 'plugin', 'configkey'],
    idProperty: 'domain',
});

Ext.define('Proxmox.panel.ACMEDomains', {
    extend: 'Ext.grid.Panel',
    xtype: 'pmxACMEDomains',
    mixins: ['Proxmox.Mixin.CBind'],

    margin: '10 0 0 0',
    title: 'ACME',

    emptyText: gettext('No Domains configured'),

    // URL to the config containing 'acme' and 'acmedomainX' properties
    url: undefined,

    // array of { name, url, usageLabel }
    domainUsages: undefined,
    // if no domainUsages parameter is supllied, the orderUrl is required instead:
    orderUrl: undefined,
    // Force the use of 'acmedomainX' properties.
    separateDomainEntries: undefined,

    acmeUrl: undefined,

    cbindData: function (config) {
        let me = this;
        return {
            acmeUrl: me.acmeUrl,
            accountUrl: `/api2/json/${me.acmeUrl}/account`,
        };
    },

    viewModel: {
        data: {
            domaincount: 0,
            account: undefined, // the account we display
            configaccount: undefined, // the account set in the config
            accountEditable: false,
            accountsAvailable: false,
            hasUsage: false,
        },

        formulas: {
            canOrder: (get) => !!get('account') && get('domaincount') > 0,
            editBtnIcon: (get) => 'fa black fa-' + (get('accountEditable') ? 'check' : 'pencil'),
            accountTextHidden: (get) => get('accountEditable') || !get('accountsAvailable'),
            accountValueHidden: (get) => !get('accountEditable') || !get('accountsAvailable'),
        },
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        init: function (view) {
            let accountSelector = this.lookup('accountselector');
            accountSelector.store.on('load', this.onAccountsLoad, this);
        },

        onAccountsLoad: function (store, records, success) {
            let me = this;
            let vm = me.getViewModel();
            let configaccount = vm.get('configaccount');
            vm.set('accountsAvailable', records.length > 0);
            if (me.autoChangeAccount && records.length > 0) {
                me.changeAccount(records[0].data.name, () => {
                    vm.set('accountEditable', false);
                    me.reload();
                });
                me.autoChangeAccount = false;
            } else if (configaccount) {
                if (store.findExact('name', configaccount) !== -1) {
                    vm.set('account', configaccount);
                } else {
                    vm.set('account', null);
                }
            }
        },

        addDomain: function () {
            let me = this;
            let view = me.getView();

            Ext.create('Proxmox.window.ACMEDomainEdit', {
                url: view.url,
                acmeUrl: view.acmeUrl,
                nodeconfig: view.nodeconfig,
                domainUsages: view.domainUsages,
                separateDomainEntries: view.separateDomainEntries,
                apiCallDone: function () {
                    me.reload();
                },
            }).show();
        },

        editDomain: function () {
            let me = this;
            let view = me.getView();

            let selection = view.getSelection();
            if (selection.length < 1) {
                return;
            }

            Ext.create('Proxmox.window.ACMEDomainEdit', {
                url: view.url,
                acmeUrl: view.acmeUrl,
                nodeconfig: view.nodeconfig,
                domainUsages: view.domainUsages,
                separateDomainEntries: view.separateDomainEntries,
                domain: selection[0].data,
                apiCallDone: function () {
                    me.reload();
                },
            }).show();
        },

        removeDomain: function () {
            let me = this;
            let view = me.getView();
            let selection = view.getSelection();
            if (selection.length < 1) {
                return;
            }

            let rec = selection[0].data;
            let params = {};
            if (rec.configkey !== 'acme') {
                params.delete = rec.configkey;
            } else {
                let acme = Proxmox.Utils.parseACME(view.nodeconfig.acme);
                Proxmox.Utils.remove_domain_from_acme(acme, rec.domain);
                params.acme = Proxmox.Utils.printACME(acme);
            }

            Proxmox.Utils.API2Request({
                method: 'PUT',
                url: view.url,
                params,
                success: function (response, opt) {
                    me.reload();
                },
                failure: function (response, opt) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
            });
        },

        toggleEditAccount: function () {
            let me = this;
            let vm = me.getViewModel();
            let editable = vm.get('accountEditable');
            if (editable) {
                me.changeAccount(vm.get('account'), function () {
                    vm.set('accountEditable', false);
                    me.reload();
                });
            } else {
                vm.set('accountEditable', true);
            }
        },

        changeAccount: function (account, callback) {
            let me = this;
            let view = me.getView();
            let params = {};

            let acme = Proxmox.Utils.parseACME(view.nodeconfig.acme);
            acme.account = account;
            params.acme = Proxmox.Utils.printACME(acme);

            Proxmox.Utils.API2Request({
                method: 'PUT',
                waitMsgTarget: view,
                url: view.url,
                params,
                success: function (response, opt) {
                    if (Ext.isFunction(callback)) {
                        callback();
                    }
                },
                failure: function (response, opt) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
            });
        },

        order: function (cert) {
            let me = this;
            let view = me.getView();

            Proxmox.Utils.API2Request({
                method: 'POST',
                params: {
                    force: 1,
                },
                url: cert ? cert.url : view.orderUrl,
                success: function (response, opt) {
                    Ext.create('Proxmox.window.TaskViewer', {
                        upid: response.result.data,
                        taskDone: function (success) {
                            me.orderFinished(success, cert);
                        },
                    }).show();
                },
                failure: function (response, opt) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
            });
        },

        orderFinished: function (success, cert) {
            if (!success || !cert.reloadUi) {
                return;
            }

            Ext.getBody().mask(
                gettext(
                    'API server will be restarted to use new certificates, please reload web-interface!',
                ),
                ['pve-static-mask'],
            );
            // try to reload after 10 seconds automatically
            Ext.defer(() => window.location.reload(true), 10000);
        },

        reload: function () {
            let me = this;
            let view = me.getView();
            view.rstore.load();
        },

        addAccount: function () {
            let me = this;
            let view = me.getView();
            Ext.create('Proxmox.window.ACMEAccountCreate', {
                autoShow: true,
                acmeUrl: view.acmeUrl,
                taskDone: function () {
                    me.reload();
                    let accountSelector = me.lookup('accountselector');
                    me.autoChangeAccount = true;
                    accountSelector.store.load();
                },
            });
        },
    },

    tbar: [
        {
            xtype: 'proxmoxButton',
            text: gettext('Add'),
            handler: 'addDomain',
            selModel: false,
        },
        {
            xtype: 'proxmoxButton',
            text: gettext('Edit'),
            disabled: true,
            handler: 'editDomain',
        },
        {
            xtype: 'proxmoxStdRemoveButton',
            handler: 'removeDomain',
        },
        '-',
        'order-menu', // placeholder, filled in initComponent
        '-',
        {
            xtype: 'displayfield',
            value: gettext('Using Account') + ':',
            bind: {
                hidden: '{!accountsAvailable}',
            },
        },
        {
            xtype: 'displayfield',
            reference: 'accounttext',
            renderer: (val) => val || Proxmox.Utils.NoneText,
            bind: {
                value: '{account}',
                hidden: '{accountTextHidden}',
            },
        },
        {
            xtype: 'pmxACMEAccountSelector',
            hidden: true,
            reference: 'accountselector',
            cbind: {
                url: '{accountUrl}',
            },
            bind: {
                value: '{account}',
                hidden: '{accountValueHidden}',
            },
        },
        {
            xtype: 'button',
            iconCls: 'fa black fa-pencil',
            baseCls: 'x-plain',
            userCls: 'pointer',
            bind: {
                iconCls: '{editBtnIcon}',
                hidden: '{!accountsAvailable}',
            },
            handler: 'toggleEditAccount',
        },
        {
            xtype: 'displayfield',
            value: gettext('No Account available.'),
            bind: {
                hidden: '{accountsAvailable}',
            },
        },
        {
            xtype: 'button',
            hidden: true,
            reference: 'accountlink',
            text: gettext('Add ACME Account'),
            bind: {
                hidden: '{accountsAvailable}',
            },
            handler: 'addAccount',
        },
    ],

    updateStore: function (store, records, success) {
        let me = this;
        let data = [];
        let rec;
        if (success && records.length > 0) {
            rec = records[0];
        } else {
            rec = {
                data: {},
            };
        }

        me.nodeconfig = rec.data; // save nodeconfig for updates

        let account = 'default';

        if (rec.data.acme) {
            let obj = Proxmox.Utils.parseACME(rec.data.acme);
            (obj.domains || []).forEach((domain) => {
                if (domain === '') {
                    return;
                }
                let record = {
                    domain,
                    type: 'standalone',
                    configkey: 'acme',
                };
                data.push(record);
            });

            if (obj.account) {
                account = obj.account;
            }
        }

        let vm = me.getViewModel();
        let oldaccount = vm.get('account');

        // account changed, and we do not edit currently, load again to verify
        if (oldaccount !== account && !vm.get('accountEditable')) {
            vm.set('configaccount', account);
            me.lookup('accountselector').store.load();
        }

        for (let i = 0; i < Proxmox.Utils.acmedomain_count; i++) {
            let acmedomain = rec.data[`acmedomain${i}`];
            if (!acmedomain) {
                continue;
            }

            let record = Proxmox.Utils.parsePropertyString(acmedomain, 'domain');
            record.type = record.plugin ? 'dns' : 'standalone';
            record.configkey = `acmedomain${i}`;
            data.push(record);
        }

        vm.set('domaincount', data.length);
        me.store.loadData(data, false);
    },

    listeners: {
        itemdblclick: 'editDomain',
    },

    columns: [
        {
            dataIndex: 'domain',
            flex: 5,
            text: gettext('Domain'),
        },
        {
            dataIndex: 'usage',
            flex: 1,
            text: gettext('Usage'),
            bind: {
                hidden: '{!hasUsage}',
            },
        },
        {
            dataIndex: 'type',
            flex: 1,
            text: gettext('Type'),
        },
        {
            dataIndex: 'plugin',
            flex: 1,
            text: gettext('Plugin'),
        },
    ],

    initComponent: function () {
        let me = this;

        if (!me.acmeUrl) {
            throw 'no acmeUrl given';
        }

        if (!me.url) {
            throw 'no url given';
        }

        if (!me.nodename) {
            throw 'no nodename given';
        }

        if (!me.domainUsages && !me.orderUrl) {
            throw 'neither domainUsages nor orderUrl given';
        }

        me.rstore = Ext.create('Proxmox.data.UpdateStore', {
            interval: 10 * 1000,
            autoStart: true,
            storeid: `proxmox-node-domains-${me.nodename}`,
            proxy: {
                type: 'proxmox',
                url: `/api2/json/${me.url}`,
            },
        });

        me.store = Ext.create('Ext.data.Store', {
            model: 'proxmox-acme-domains',
            sorters: 'domain',
        });

        if (me.domainUsages) {
            let items = [];

            for (const cert of me.domainUsages) {
                if (!cert.name) {
                    throw 'missing certificate url';
                }

                if (!cert.url) {
                    throw 'missing certificate url';
                }

                items.push({
                    text: Ext.String.format('Order {0} Certificate Now', cert.name),
                    handler: function () {
                        return me.getController().order(cert);
                    },
                });
            }
            me.tbar.splice(me.tbar.indexOf('order-menu'), 1, {
                text: gettext('Order Certificates Now'),
                menu: {
                    xtype: 'menu',
                    items,
                },
            });
        } else {
            me.tbar.splice(me.tbar.indexOf('order-menu'), 1, {
                xtype: 'button',
                reference: 'order',
                text: gettext('Order Certificates Now'),
                bind: {
                    disabled: '{!canOrder}',
                },
                handler: function () {
                    return me.getController().order();
                },
            });
        }

        me.callParent();
        me.getViewModel().set('hasUsage', !!me.domainUsages);
        me.mon(me.rstore, 'load', 'updateStore', me);
        Proxmox.Utils.monStoreErrors(me, me.rstore);
        me.on('destroy', me.rstore.stopUpdate, me.rstore);
    },
});
Ext.define('Proxmox.panel.EmailRecipientPanel', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmxEmailRecipientPanel',
    mixins: ['Proxmox.Mixin.CBind'],
    border: false,

    mailValidator: function () {
        let mailto_user = this.down(`[name=mailto-user]`);
        let mailto = this.down(`[name=mailto]`);

        if (!mailto_user.getValue()?.length && !mailto.getValue()) {
            return gettext('Either mailto or mailto-user must be set');
        }

        return true;
    },

    items: [
        {
            layout: 'anchor',
            border: false,
            cbind: {
                isCreate: '{isCreate}',
            },
            items: [
                {
                    xtype: 'pmxUserSelector',
                    name: 'mailto-user',
                    multiSelect: true,
                    allowBlank: true,
                    editable: false,
                    skipEmptyText: true,
                    fieldLabel: gettext('Recipient(s)'),
                    cbind: {
                        deleteEmpty: '{!isCreate}',
                    },
                    validator: function () {
                        return this.up('pmxEmailRecipientPanel').mailValidator();
                    },
                    autoEl: {
                        tag: 'div',
                        'data-qtip': gettext(
                            "The notification will be sent to the user's configured mail address",
                        ),
                    },
                    listConfig: {
                        width: 600,
                        columns: [
                            {
                                header: gettext('User'),
                                sortable: true,
                                dataIndex: 'userid',
                                renderer: Ext.String.htmlEncode,
                                flex: 1,
                            },
                            {
                                header: gettext('E-Mail'),
                                sortable: true,
                                dataIndex: 'email',
                                renderer: Ext.String.htmlEncode,
                                flex: 1,
                            },
                            {
                                header: gettext('Comment'),
                                sortable: false,
                                dataIndex: 'comment',
                                renderer: Ext.String.htmlEncode,
                                flex: 1,
                            },
                        ],
                    },
                },
                {
                    xtype: 'proxmoxtextfield',
                    fieldLabel: gettext('Additional Recipient(s)'),
                    name: 'mailto',
                    allowBlank: true,
                    emptyText: 'user@example.com, ...',
                    cbind: {
                        deleteEmpty: '{!isCreate}',
                    },
                    autoEl: {
                        tag: 'div',
                        'data-qtip': gettext(
                            'Multiple recipients must be separated by spaces, commas or semicolons',
                        ),
                    },
                    validator: function () {
                        return this.up('pmxEmailRecipientPanel').mailValidator();
                    },
                },
            ],
        },
    ],
});
Ext.define('Proxmox.panel.SendmailEditPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxSendmailEditPanel',
    mixins: ['Proxmox.Mixin.CBind'],

    type: 'sendmail',
    onlineHelp: 'notification_targets_sendmail',

    mailValidator: function () {
        let mailto_user = this.down(`[name=mailto-user]`);
        let mailto = this.down(`[name=mailto]`);

        if (!mailto_user.getValue()?.length && !mailto.getValue()) {
            return gettext('Either mailto or mailto-user must be set');
        }

        return true;
    },

    items: [
        {
            xtype: 'pmxDisplayEditField',
            name: 'name',
            cbind: {
                value: '{name}',
                editable: '{isCreate}',
            },
            fieldLabel: gettext('Endpoint Name'),
            allowBlank: false,
        },
        {
            xtype: 'proxmoxcheckbox',
            name: 'enable',
            fieldLabel: gettext('Enable'),
            allowBlank: false,
            checked: true,
        },
        {
            // provides 'mailto' and 'mailto-user' fields
            xtype: 'pmxEmailRecipientPanel',
            cbind: {
                isCreate: '{isCreate}',
            },
        },
        {
            xtype: 'proxmoxtextfield',
            name: 'comment',
            fieldLabel: gettext('Comment'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],

    advancedItems: [
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('Author'),
            name: 'author',
            allowBlank: true,
            cbind: {
                emptyText: '{defaultMailAuthor}',
                deleteEmpty: '{!isCreate}',
            },
        },
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('From Address'),
            name: 'from-address',
            allowBlank: true,
            emptyText: gettext('Defaults to datacenter configuration, or root@$hostname'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],

    onSetValues: (values) => {
        values.enable = !values.disable;

        delete values.disable;
        return values;
    },

    onGetValues: function (values) {
        let me = this;

        if (values.enable) {
            if (!me.isCreate) {
                Proxmox.Utils.assemble_field_data(values, { delete: 'disable' });
            }
        } else {
            values.disable = 1;
        }

        delete values.enable;

        if (values.mailto) {
            values.mailto = values.mailto.split(/[\s,;]+/);
        }
        return values;
    },
});
Ext.define('Proxmox.panel.SmtpEditPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxSmtpEditPanel',
    mixins: ['Proxmox.Mixin.CBind'],
    onlineHelp: 'notification_targets_smtp',

    type: 'smtp',

    viewModel: {
        xtype: 'viewmodel',
        data: {
            mode: 'tls',
            authentication: true,
            originalAuthentication: true,
        },
        formulas: {
            portEmptyText: function (get) {
                let port;

                switch (get('mode')) {
                    case 'insecure':
                        port = 25;
                        break;
                    case 'starttls':
                        port = 587;
                        break;
                    case 'tls':
                        port = 465;
                        break;
                }
                return `${Proxmox.Utils.defaultText} (${port})`;
            },
            passwordEmptyText: function (get) {
                let isCreate = this.getView().isCreate;

                let auth = get('authentication');
                let origAuth = get('originalAuthentication');
                let shouldShowUnchanged = !isCreate && auth && origAuth;

                return shouldShowUnchanged ? gettext('Unchanged') : '';
            },
        },
    },

    columnT: [
        {
            xtype: 'pmxDisplayEditField',
            name: 'name',
            cbind: {
                value: '{name}',
                editable: '{isCreate}',
            },
            fieldLabel: gettext('Endpoint Name'),
            allowBlank: false,
        },
        {
            xtype: 'proxmoxcheckbox',
            name: 'enable',
            fieldLabel: gettext('Enable'),
            allowBlank: false,
            checked: true,
        },
    ],

    column1: [
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('Server'),
            name: 'server',
            allowBlank: false,
            emptyText: gettext('mail.example.com'),
        },
        {
            xtype: 'proxmoxKVComboBox',
            name: 'mode',
            fieldLabel: gettext('Encryption'),
            editable: false,
            comboItems: [
                ['insecure', gettext('None (insecure)')],
                ['starttls', 'STARTTLS'],
                ['tls', 'TLS'],
            ],
            bind: '{mode}',
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
        {
            xtype: 'proxmoxintegerfield',
            name: 'port',
            fieldLabel: gettext('Port'),
            minValue: 1,
            maxValue: 65535,
            bind: {
                emptyText: '{portEmptyText}',
            },
            submitEmptyText: false,
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],
    column2: [
        {
            xtype: 'proxmoxcheckbox',
            fieldLabel: gettext('Authenticate'),
            name: 'authentication',
            bind: {
                value: '{authentication}',
            },
        },
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('Username'),
            name: 'username',
            allowBlank: false,
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
            bind: {
                disabled: '{!authentication}',
            },
        },
        {
            xtype: 'proxmoxtextfield',
            inputType: 'password',
            fieldLabel: gettext('Password'),
            name: 'password',
            cbind: {
                allowBlank: '{!isCreate}',
            },
            bind: {
                disabled: '{!authentication}',
                emptyText: '{passwordEmptyText}',
            },
        },
    ],
    columnB: [
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('From Address'),
            name: 'from-address',
            allowBlank: false,
            emptyText: gettext('user@example.com'),
        },
        {
            // provides 'mailto' and 'mailto-user' fields
            xtype: 'pmxEmailRecipientPanel',
            cbind: {
                isCreate: '{isCreate}',
            },
        },
        {
            xtype: 'proxmoxtextfield',
            name: 'comment',
            fieldLabel: gettext('Comment'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],

    advancedColumnB: [
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('Author'),
            name: 'author',
            allowBlank: true,
            cbind: {
                emptyText: '{defaultMailAuthor}',
                deleteEmpty: '{!isCreate}',
            },
        },
    ],

    onGetValues: function (values) {
        let me = this;

        if (values.mailto) {
            values.mailto = values.mailto.split(/[\s,;]+/);
        }

        if (!values.authentication && !me.isCreate) {
            Proxmox.Utils.assemble_field_data(values, { delete: 'username' });
            Proxmox.Utils.assemble_field_data(values, { delete: 'password' });
        }

        if (values.enable) {
            if (!me.isCreate) {
                Proxmox.Utils.assemble_field_data(values, { delete: 'disable' });
            }
        } else {
            values.disable = 1;
        }

        delete values.enable;

        delete values.authentication;

        return values;
    },

    onSetValues: function (values) {
        let me = this;

        values.authentication = !!values.username;
        values.enable = !values.disable;
        delete values.disable;

        // Fix race condition in chromium-based browsers. Without this, the
        // 'Authenticate' remains ticked (the default value) if loading an
        // SMTP target without authentication.
        me.getViewModel().set('authentication', values.authentication);
        me.getViewModel().set('originalAuthentication', values.authentication);

        return values;
    },
});
Ext.define('Proxmox.panel.StatusView', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pmxStatusView',

    layout: {
        type: 'column',
    },

    title: gettext('Status'),

    getRecordValue: function (key, store) {
        let me = this;

        if (!key) {
            throw 'no key given';
        }

        if (store === undefined) {
            store = me.getStore();
        }

        let rec = store.getById(key);
        if (rec) {
            return rec.data.value;
        }
        return '';
    },

    fieldRenderer: function (val, max) {
        if (max === undefined) {
            return val;
        }

        if (!Ext.isNumeric(max) || max === 1) {
            return Proxmox.Utils.render_usage(val);
        }
        return Proxmox.Utils.render_size_usage(val, max);
    },

    fieldCalculator: function (used, max) {
        if (!Ext.isNumeric(max) && Ext.isNumeric(used)) {
            return used;
        } else if (!Ext.isNumeric(used)) {
            /* we come here if the field is from a node
             * where the records are not mem and maxmem
             * but mem.used and mem.total
             */
            if (used.used !== undefined && used.total !== undefined) {
                return used.total > 0 ? used.used / used.total : 0;
            }
        }

        return used / max;
    },

    updateField: function (field) {
        let me = this;
        let renderer = me.fieldRenderer;
        if (Ext.isFunction(field.renderer)) {
            renderer = field.renderer;
        }
        if (field.multiField === true) {
            field.updateValue(renderer.call(field, me.getStore().getRecord()));
        } else if (field.textField !== undefined) {
            field.updateValue(renderer.call(field, me.getRecordValue(field.textField)));
        } else if (field.valueField !== undefined) {
            let used = me.getRecordValue(field.valueField);
            let max = field.maxField !== undefined ? me.getRecordValue(field.maxField) : 1;

            let calculate = me.fieldCalculator;
            if (Ext.isFunction(field.calculate)) {
                calculate = field.calculate;
            }
            field.updateValue(renderer.call(field, used, max), calculate(used, max));
        }
    },

    getStore: function () {
        let me = this;

        if (!me.rstore) {
            throw 'there is no rstore';
        }

        return me.rstore;
    },

    updateTitle: function () {
        let me = this;
        me.setTitle(me.getRecordValue('name'));
    },

    updateValues: function (store, records, success) {
        let me = this;

        if (!success) {
            return; // do not update if store load was not successful
        }
        me.query('pmxInfoWidget').forEach(me.updateField, me);
        me.query('pveInfoWidget').forEach(me.updateField, me);

        me.updateTitle(store);
    },

    initComponent: function () {
        let me = this;

        if (!me.rstore) {
            throw 'no rstore given';
        }
        if (!me.title) {
            throw 'no title given';
        }

        Proxmox.Utils.monStoreErrors(me, me.rstore);

        me.callParent();

        me.mon(me.rstore, 'load', me.updateValues, me);
    },
});
Ext.define('pmx-tfa-users', {
    extend: 'Ext.data.Model',
    fields: ['userid'],
    idProperty: 'userid',
    proxy: {
        type: 'proxmox',
        url: '/api2/json/access/tfa',
    },
});

Ext.define('pmx-tfa-entry', {
    extend: 'Ext.data.Model',
    fields: ['fullid', 'userid', 'type', 'description', 'created', 'enable'],
    idProperty: 'fullid',
});

Ext.define('Proxmox.panel.TfaView', {
    extend: 'Ext.grid.GridPanel',
    alias: 'widget.pmxTfaView',
    mixins: ['Proxmox.Mixin.CBind'],

    title: gettext('Second Factors'),
    reference: 'tfaview',

    issuerName: 'Proxmox',
    yubicoEnabled: false,

    cbindData: function (initialConfig) {
        let me = this;
        return {
            yubicoEnabled: me.yubicoEnabled,
        };
    },

    store: {
        type: 'diff',
        autoDestroy: true,
        autoDestroyRstore: true,
        model: 'pmx-tfa-entry',
        rstore: {
            type: 'store',
            proxy: 'memory',
            storeid: 'pmx-tfa-entry',
            model: 'pmx-tfa-entry',
        },
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        init: function (view) {
            let _me = this;
            view.tfaStore = Ext.create('Proxmox.data.UpdateStore', {
                autoStart: true,
                interval: 5 * 1000,
                storeid: 'pmx-tfa-users',
                model: 'pmx-tfa-users',
            });
            view.tfaStore.on('load', this.onLoad, this);
            view.on('destroy', view.tfaStore.stopUpdate);
            Proxmox.Utils.monStoreErrors(view, view.tfaStore);
        },

        reload: function () {
            this.getView().tfaStore.load();
        },

        onLoad: function (store, data, success) {
            if (!success) {
                return;
            }

            let now = new Date().getTime() / 1000;
            let records = [];
            Ext.Array.each(data, (user) => {
                let tfa_locked = (user.data['tfa-locked-until'] || 0) > now;
                let totp_locked = user.data['totp-locked'];
                Ext.Array.each(user.data.entries, (entry) => {
                    records.push({
                        fullid: `${user.id}/${entry.id}`,
                        userid: user.id,
                        type: entry.type,
                        description: entry.description,
                        created: entry.created,
                        enable: entry.enable,
                        locked: tfa_locked || (entry.type === 'totp' && totp_locked),
                    });
                });
            });

            let rstore = this.getView().store.rstore;
            rstore.loadData(records);
            rstore.fireEvent('load', rstore, records, true);
        },

        addTotp: function () {
            let me = this;

            Ext.create('Proxmox.window.AddTotp', {
                isCreate: true,
                issuerName: me.getView().issuerName,
                listeners: {
                    destroy: function () {
                        me.reload();
                    },
                },
            }).show();
        },

        addWebauthn: function () {
            let me = this;

            Ext.create('Proxmox.window.AddWebauthn', {
                isCreate: true,
                autoShow: true,
                listeners: {
                    destroy: () => me.reload(),
                },
            });
        },

        addRecovery: async function () {
            let me = this;

            Ext.create('Proxmox.window.AddTfaRecovery', {
                autoShow: true,
                listeners: {
                    destroy: () => me.reload(),
                },
            });
        },

        addYubico: function () {
            let me = this;

            Ext.create('Proxmox.window.AddYubico', {
                isCreate: true,
                autoShow: true,
                listeners: {
                    destroy: () => me.reload(),
                },
            });
        },

        editItem: function () {
            let me = this;
            let view = me.getView();
            let selection = view.getSelection();
            if (selection.length !== 1 || selection[0].id.endsWith('/recovery')) {
                return;
            }

            Ext.create('Proxmox.window.TfaEdit', {
                'tfa-id': selection[0].data.fullid,
                autoShow: true,
                listeners: {
                    destroy: () => me.reload(),
                },
            });
        },

        renderUser: (fullid) => fullid.split('/')[0],

        renderEnabled: function (enabled, metaData, record) {
            if (record.data.locked) {
                return gettext('Locked');
            } else if (enabled === undefined) {
                return Proxmox.Utils.yesText;
            } else {
                return Proxmox.Utils.format_boolean(enabled);
            }
        },

        onRemoveButton: function (btn, event, record) {
            let me = this;

            Ext.create('Proxmox.tfa.confirmRemove', {
                ...record.data,
                callback: (password) => me.removeItem(password, record),
                autoShow: true,
            });
        },

        removeItem: async function (password, record) {
            let me = this;

            if (password !== null) {
                password = '?password=' + encodeURIComponent(password);
            } else {
                password = '';
            }

            try {
                me.getView().mask(gettext('Please wait...'), 'x-mask-loading');
                await Proxmox.Async.api2({
                    url: `/api2/extjs/access/tfa/${record.id}${password}`,
                    method: 'DELETE',
                });
                me.reload();
            } catch (response) {
                Ext.Msg.alert(gettext('Error'), response.result.message);
            } finally {
                me.getView().unmask();
            }
        },
    },

    viewConfig: {
        trackOver: false,
    },

    listeners: {
        itemdblclick: 'editItem',
    },

    columns: [
        {
            header: gettext('User'),
            width: 200,
            sortable: true,
            dataIndex: 'fullid',
            renderer: 'renderUser',
        },
        {
            header: gettext('Enabled'),
            width: 80,
            sortable: true,
            dataIndex: 'enable',
            renderer: 'renderEnabled',
        },
        {
            header: gettext('TFA Type'),
            width: 80,
            sortable: true,
            dataIndex: 'type',
        },
        {
            header: gettext('Created'),
            width: 150,
            sortable: true,
            dataIndex: 'created',
            renderer: (t) => (!t ? 'N/A' : Proxmox.Utils.render_timestamp(t)),
        },
        {
            header: gettext('Description'),
            width: 300,
            sortable: true,
            dataIndex: 'description',
            renderer: Ext.String.htmlEncode,
            flex: 1,
        },
    ],

    tbar: [
        {
            text: gettext('Add'),
            cbind: {},
            menu: {
                xtype: 'menu',
                items: [
                    {
                        text: gettext('TOTP'),
                        itemId: 'totp',
                        iconCls: 'fa fa-fw fa-clock-o',
                        handler: 'addTotp',
                    },
                    {
                        text: gettext('WebAuthn'),
                        itemId: 'webauthn',
                        iconCls: 'fa fa-fw fa-shield',
                        handler: 'addWebauthn',
                    },
                    {
                        text: gettext('Recovery Keys'),
                        itemId: 'recovery',
                        iconCls: 'fa fa-fw fa-file-text-o',
                        handler: 'addRecovery',
                    },
                    {
                        text: gettext('Yubico OTP'),
                        itemId: 'yubico',
                        iconCls: 'fa fa-fw fa-yahoo', // close enough
                        handler: 'addYubico',
                        cbind: {
                            hidden: '{!yubicoEnabled}',
                        },
                    },
                ],
            },
        },
        '-',
        {
            xtype: 'proxmoxButton',
            text: gettext('Edit'),
            handler: 'editItem',
            enableFn: (rec) => !rec.id.endsWith('/recovery'),
            disabled: true,
        },
        {
            xtype: 'proxmoxButton',
            disabled: true,
            text: gettext('Remove'),
            getRecordName: (rec) => rec.data.description,
            handler: 'onRemoveButton',
        },
    ],
});
Ext.define('Proxmox.panel.NotesView', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmxNotesView',
    mixins: ['Proxmox.Mixin.CBind'],

    title: gettext('Notes'),
    bodyPadding: 10,
    scrollable: true,
    animCollapse: false,
    collapseFirst: false,

    maxLength: 64 * 1024,
    enableTBar: false,
    onlineHelp: 'markdown_basics',

    tbar: {
        itemId: 'tbar',
        hidden: true,
        items: [
            {
                text: gettext('Edit'),
                iconCls: 'fa fa-pencil-square-o',
                handler: function () {
                    let view = this.up('panel');
                    view.run_editor();
                },
            },
        ],
    },

    cbindData: function (initalConfig) {
        let me = this;
        let type = '';

        if (me.node) {
            me.url = `/api2/extjs/nodes/${me.node}/config`;
        } else if (me.pveSelNode?.data?.id === 'root') {
            me.url = '/api2/extjs/cluster/options';
            type = me.pveSelNode?.data?.type;
        } else {
            const nodename = me.pveSelNode?.data?.node;
            type = me.pveSelNode?.data?.type;

            if (!nodename) {
                throw 'no node name specified';
            }

            if (!Ext.Array.contains(['node', 'qemu', 'lxc'], type)) {
                throw 'invalid type specified';
            }

            const vmid = me.pveSelNode?.data?.vmid;

            if (!vmid && type !== 'node') {
                throw 'no VM ID specified';
            }

            me.url = `/api2/extjs/nodes/${nodename}/`;

            // add the type specific path if qemu/lxc and set the backend's maxLen
            if (type === 'qemu' || type === 'lxc') {
                me.url += `${type}/${vmid}/`;
                me.maxLength = 8 * 1024;
            }

            me.url += 'config';
        }

        me.pveType = type;

        me.load();
        return {};
    },

    run_editor: function () {
        let me = this;
        Ext.create('Proxmox.window.NotesEdit', {
            url: me.url,
            onlineHelp: me.onlineHelp,
            listeners: {
                destroy: () => me.load(),
            },
            autoShow: true,
        }).setMaxLength(me.maxLength);
    },

    setNotes: function (value = '') {
        let me = this;

        let mdHtml = Proxmox.Markdown.parse(value);
        me.update(mdHtml);

        if (me.collapsible && me.collapseMode === 'auto') {
            me.setCollapsed(!value);
        }
    },

    load: function () {
        let me = this;

        Proxmox.Utils.API2Request({
            url: me.url,
            waitMsgTarget: me,
            failure: (response, opts) => {
                me.update(gettext('Error') + ' ' + response.htmlStatus);
                me.setCollapsed(false);
            },
            success: ({ result }) => me.setNotes(result.data.description),
        });
    },

    listeners: {
        render: function (c) {
            let me = this;
            let sp = Ext.state.Manager.getProvider();
            // to cover live changes to the browser setting
            me.mon(sp, 'statechange', function (provider, key, value) {
                if (value === null || key !== 'edit-notes-on-double-click') {
                    return;
                }
                if (value) {
                    me.getEl().on('dblclick', me.run_editor, me);
                } else {
                    // there's only the me.run_editor listener, and removing just that did not work
                    me.getEl().clearListeners();
                }
            });
            // to cover initial setting value
            if (sp.get('edit-notes-on-double-click', false)) {
                me.getEl().on('dblclick', me.run_editor, me);
            }
        },
        afterlayout: function () {
            let me = this;
            if (me.collapsible && !me.getCollapsed() && me.collapseMode === 'always') {
                me.setCollapsed(true);
                me.collapseMode = ''; // only once, on initial load!
            }
        },
    },

    tools: [
        {
            glyph: 'xf044@FontAwesome', // fa-pencil-square-o
            tooltip: gettext('Edit notes'),
            callback: (view) => view.run_editor(),
            style: {
                paddingRight: '5px',
            },
        },
    ],

    initComponent: function () {
        let me = this;
        me.callParent();

        // '' is for datacenter
        if (me.enableTBar === true || me.pveType === 'node' || me.pveType === '') {
            me.down('#tbar').setVisible(true);
        } else if (me.pveSelNode?.data?.template !== 1) {
            me.setCollapsible(true);
            me.collapseDirection = 'right';

            let sp = Ext.state.Manager.getProvider();
            me.collapseMode = sp.get('guest-notes-collapse', 'never');

            if (me.collapseMode === 'auto') {
                me.setCollapsed(true);
            }
        }
    },
});
Ext.define('Proxmox.panel.WebhookEditPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxWebhookEditPanel',
    mixins: ['Proxmox.Mixin.CBind'],
    onlineHelp: 'notification_targets_webhook',

    type: 'webhook',

    columnT: [],

    column1: [
        {
            xtype: 'pmxDisplayEditField',
            name: 'name',
            cbind: {
                value: '{name}',
                editable: '{isCreate}',
            },
            fieldLabel: gettext('Endpoint Name'),
            regex: Proxmox.Utils.safeIdRegex,
            allowBlank: false,
        },
    ],

    column2: [
        {
            xtype: 'proxmoxcheckbox',
            name: 'enable',
            fieldLabel: gettext('Enable'),
            allowBlank: false,
            checked: true,
        },
    ],

    columnB: [
        {
            xtype: 'fieldcontainer',
            fieldLabel: gettext('Method/URL'),
            layout: 'hbox',
            border: false,
            margin: '0 0 5 0',
            items: [
                {
                    xtype: 'proxmoxKVComboBox',
                    name: 'method',
                    editable: false,
                    value: 'post',
                    comboItems: [
                        ['post', 'POST'],
                        ['put', 'PUT'],
                        ['get', 'GET'],
                    ],
                    width: 80,
                    margin: '0 5 0 0',
                },
                {
                    xtype: 'proxmoxtextfield',
                    name: 'url',
                    allowBlank: false,
                    emptyText: 'https://example.com/hook',
                    regex: Proxmox.Utils.httpUrlRegex,
                    regexText: gettext('Must be a valid URL'),
                    flex: 4,
                },
            ],
        },
        {
            xtype: 'pmxWebhookKeyValueList',
            name: 'header',
            fieldLabel: gettext('Headers'),
            addLabel: gettext('Add Header'),
            maskValues: false,
            cbind: {
                isCreate: '{isCreate}',
            },
            margin: '0 0 10 0',
        },
        {
            xtype: 'textarea',
            fieldLabel: gettext('Body'),
            name: 'body',
            allowBlank: true,
            minHeight: '150',
            fieldStyle: {
                'font-family': 'monospace',
            },
            margin: '0 0 5 0',
        },
        {
            xtype: 'pmxWebhookKeyValueList',
            name: 'secret',
            fieldLabel: gettext('Secrets'),
            addLabel: gettext('Add Secret'),
            maskValues: true,
            cbind: {
                isCreate: '{isCreate}',
            },
            margin: '0 0 10 0',
        },
        {
            xtype: 'proxmoxtextfield',
            name: 'comment',
            fieldLabel: gettext('Comment'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],

    onSetValues: (values) => {
        values.enable = !values.disable;

        if (values.body) {
            values.body = Proxmox.Utils.base64ToUtf8(values.body);
        }

        delete values.disable;
        return values;
    },

    onGetValues: function (values) {
        let me = this;

        if (values.enable) {
            if (!me.isCreate) {
                Proxmox.Utils.assemble_field_data(values, { delete: 'disable' });
            }
        } else {
            values.disable = 1;
        }

        if (values.body) {
            values.body = Proxmox.Utils.utf8ToBase64(values.body);
        } else {
            delete values.body;
            if (!me.isCreate) {
                Proxmox.Utils.assemble_field_data(values, { delete: 'body' });
            }
        }

        if (Ext.isArray(values.header) && !values.header.length) {
            delete values.header;
            if (!me.isCreate) {
                Proxmox.Utils.assemble_field_data(values, { delete: 'header' });
            }
        }

        if (Ext.isArray(values.secret) && !values.secret.length) {
            delete values.secret;
            if (!me.isCreate) {
                Proxmox.Utils.assemble_field_data(values, { delete: 'secret' });
            }
        }
        delete values.enable;

        return values;
    },
});

Ext.define('Proxmox.form.WebhookKeyValueList', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.pmxWebhookKeyValueList',

    mixins: ['Ext.form.field.Field'],

    // override for column header
    fieldTitle: gettext('Item'),

    // label displayed in the "Add" button
    addLabel: undefined,

    // will be applied to the textfields
    maskRe: undefined,

    allowBlank: true,
    selectAll: false,
    isFormField: true,
    deleteEmpty: false,
    config: {
        deleteEmpty: false,
        maskValues: false,
    },

    setValue: function (list) {
        let me = this;

        list = Ext.isArray(list) ? list : (list ?? '').split(';').filter((t) => t !== '');

        let store = me.lookup('grid').getStore();
        if (list.length > 0) {
            store.setData(
                list.map((item) => {
                    let properties = Proxmox.Utils.parsePropertyString(item);

                    // decode base64
                    let value = me.maskValues ? '' : Proxmox.Utils.base64ToUtf8(properties.value);

                    let obj = {
                        headerName: properties.name,
                        headerValue: value,
                    };

                    if (!me.isCreate && me.maskValues) {
                        obj.emptyText = gettext('Unchanged');
                    }

                    return obj;
                }),
            );
        } else {
            store.removeAll();
        }
        me.checkChange();
        return me;
    },

    getValue: function () {
        let me = this;
        let values = [];
        me.lookup('grid')
            .getStore()
            .each((rec) => {
                if (rec.data.headerName) {
                    let obj = {
                        name: rec.data.headerName,
                        value: Proxmox.Utils.utf8ToBase64(rec.data.headerValue),
                    };

                    values.push(Proxmox.Utils.printPropertyString(obj));
                }
            });

        return values;
    },

    getErrors: function (value) {
        let me = this;
        let empty = false;

        me.lookup('grid')
            .getStore()
            .each((rec) => {
                if (!rec.data.headerName) {
                    empty = true;
                }

                if (!rec.data.headerValue && rec.data.newValue) {
                    empty = true;
                }

                if (!rec.data.headerValue && !me.maskValues) {
                    empty = true;
                }
            });
        if (empty) {
            return [gettext('Name/value must not be empty.')];
        }
        return [];
    },

    // override framework function to implement deleteEmpty behaviour
    getSubmitData: function () {
        let me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue) {
            val = me.getValue();
            if (val !== null && val !== '') {
                data = {};
                data[me.getName()] = val;
            } else if (me.getDeleteEmpty()) {
                data = {};
                data.delete = me.getName();
            }
        }
        return data;
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        addLine: function () {
            let me = this;
            me.lookup('grid')
                .getStore()
                .add({
                    headerName: '',
                    headerValue: '',
                    emptyText: gettext('Value'),
                    newValue: true,
                });
        },

        removeSelection: function (field) {
            let me = this;
            let view = me.getView();
            let grid = me.lookup('grid');

            let record = field.getWidgetRecord();
            if (record === undefined) {
                // this is sometimes called before a record/column is initialized
                return;
            }

            grid.getStore().remove(record);
            view.checkChange();
            view.validate();
        },

        itemChange: function (field, newValue) {
            let rec = field.getWidgetRecord();
            if (!rec) {
                return;
            }

            let column = field.getWidgetColumn();
            rec.set(column.dataIndex, newValue);
            let list = field.up('pmxWebhookKeyValueList');
            list.checkChange();
            list.validate();
        },

        control: {
            'grid button': {
                click: 'removeSelection',
            },
        },
    },

    initComponent: function () {
        let me = this;

        let items = [
            {
                xtype: 'grid',
                reference: 'grid',
                minHeight: 100,
                maxHeight: 100,
                scrollable: 'vertical',

                viewConfig: {
                    deferEmptyText: false,
                },

                store: {
                    listeners: {
                        update: function () {
                            this.commitChanges();
                        },
                    },
                },
                margin: '5 0 5 0',
                columns: [
                    {
                        header: me.fieldTtitle,
                        dataIndex: 'headerName',
                        xtype: 'widgetcolumn',
                        widget: {
                            xtype: 'textfield',
                            isFormField: false,
                            maskRe: me.maskRe,
                            allowBlank: false,
                            queryMode: 'local',
                            emptyText: gettext('Key'),
                            listeners: {
                                change: 'itemChange',
                            },
                        },
                        onWidgetAttach: function (_col, widget) {
                            widget.isValid();
                        },
                        flex: 1,
                    },
                    {
                        header: me.fieldTtitle,
                        dataIndex: 'headerValue',
                        xtype: 'widgetcolumn',
                        widget: {
                            xtype: 'proxmoxtextfield',
                            inputType: me.maskValues ? 'password' : 'text',
                            isFormField: false,
                            maskRe: me.maskRe,
                            queryMode: 'local',
                            listeners: {
                                change: 'itemChange',
                            },
                            allowBlank: !me.isCreate && me.maskValues,

                            bind: {
                                emptyText: '{record.emptyText}',
                            },
                        },
                        onWidgetAttach: function (_col, widget) {
                            widget.isValid();
                        },
                        flex: 1,
                    },
                    {
                        xtype: 'widgetcolumn',
                        width: 40,
                        widget: {
                            xtype: 'button',
                            iconCls: 'fa fa-trash-o',
                        },
                    },
                ],
            },
            {
                xtype: 'button',
                text: me.addLabel ? me.addLabel : gettext('Add'),
                iconCls: 'fa fa-plus-circle',
                handler: 'addLine',
            },
        ];

        for (const [key, value] of Object.entries(me.gridConfig ?? {})) {
            items[0][key] = value;
        }

        Ext.apply(me, {
            items,
        });

        me.callParent();
        me.initField();
    },
});
Ext.define('Proxmox.window.Edit', {
    extend: 'Ext.window.Window',
    alias: 'widget.proxmoxWindowEdit',

    // autoLoad trigger a load() after component creation
    autoLoad: false,
    // set extra options like params for the load request
    autoLoadOptions: undefined,

    // to submit extra params on load and submit, useful, e.g., if not all ID
    // parameters are included in the URL
    extraRequestParams: {},

    resizable: false,

    // use this to automatically generate a title like `Create: <subject>`
    subject: undefined,

    // set isCreate to true if you want a Create button (instead OK and RESET)
    isCreate: false,

    // set to true if you want an Add button (instead of Create)
    isAdd: false,

    // set to true if you want a Remove button (instead of Create)
    isRemove: false,

    // set to false, if you don't want the reset button present
    showReset: true,

    // custom submitText
    submitText: undefined,

    // custom options for the submit api call
    submitOptions: {},

    backgroundDelay: 0,

    // string or function, called as (url, values) - useful if the ID of the
    // new object is part of the URL, or that URL differs from GET/PUT URL
    submitUrl: Ext.identityFn,

    // string or function, called as (url, initialConfig) - mostly for
    // consistency with submitUrl existing. If both are set `url` gets optional
    loadUrl: Ext.identityFn,

    // needed for finding the reference to submitbutton
    // because we do not have a controller
    referenceHolder: true,
    defaultButton: 'submitbutton',

    // finds the first form field
    defaultFocus: 'field:focusable[disabled=false][hidden=false]',

    showProgress: false,

    showTaskViewer: false,

    // gets called if we have a progress bar or taskview and it detected that
    // the task finished. function(success)
    taskDone: Ext.emptyFn,

    // gets called when the api call is finished, right at the beginning
    // function(success, response, options)
    apiCallDone: Ext.emptyFn,

    // assign a reference from docs, to add a help button docked to the
    // bottom of the window. If undefined we magically fall back to the
    // onlineHelp of our first item, if set.
    onlineHelp: undefined,

    constructor: function (conf) {
        let me = this;
        // make copies in order to prevent subclasses from accidentally writing
        // to objects that are shared with other edit window subclasses
        me.extraRequestParams = Object.assign({}, me.extraRequestParams);
        me.submitOptions = Object.assign({}, me.submitOptions);
        me.callParent(arguments);
    },

    isValid: function () {
        let me = this;

        let form = me.formPanel.getForm();
        return form.isValid();
    },

    getValues: function (dirtyOnly) {
        let me = this;

        let values = {};
        Ext.apply(values, me.extraRequestParams);

        let form = me.formPanel.getForm();

        form.getFields().each(function (field) {
            if (!field.up('inputpanel') && (!dirtyOnly || field.isDirty())) {
                Proxmox.Utils.assemble_field_data(values, field.getSubmitData());
            }
        });

        Ext.Array.each(me.query('inputpanel'), function (panel) {
            Proxmox.Utils.assemble_field_data(values, panel.getValues(dirtyOnly));
        });

        return values;
    },

    setValues: function (values) {
        let me = this;

        let form = me.formPanel.getForm();
        let formfields = form.getFields();

        Ext.iterate(values, function (id, val) {
            let fields = formfields.filterBy(
                (f) => (f.id === id || f.name === id || f.dataIndex === id) && !f.up('inputpanel'),
            );
            fields.each((field) => {
                field.setValue(val);
                if (form.trackResetOnLoad) {
                    field.resetOriginalValue();
                }
            });
        });

        Ext.Array.each(me.query('inputpanel'), function (panel) {
            panel.setValues(values);
        });
    },

    setSubmitText: function (text) {
        this.lookup('submitbutton').setText(text);
    },

    submit: function () {
        let me = this;

        let form = me.formPanel.getForm();

        let values = me.getValues();
        Ext.Object.each(values, function (name, val) {
            if (Object.hasOwn(values, name)) {
                if (Ext.isArray(val) && !val.length) {
                    values[name] = '';
                }
            }
        });

        if (me.digest) {
            values.digest = me.digest;
        }

        if (me.backgroundDelay) {
            values.background_delay = me.backgroundDelay;
        }

        let url = Ext.isFunction(me.submitUrl)
            ? me.submitUrl(me.url, values)
            : me.submitUrl || me.url;
        if (me.method === 'DELETE') {
            url = url + '?' + Ext.Object.toQueryString(values);
            values = undefined;
        }

        let requestOptions = Ext.apply(
            {
                url: url,
                waitMsgTarget: me,
                method: me.method || (me.backgroundDelay ? 'POST' : 'PUT'),
                params: values,
                failure: function (response, options) {
                    me.apiCallDone(false, response, options);

                    if (response.result && response.result.errors) {
                        form.markInvalid(response.result.errors);
                    }
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
                success: function (response, options) {
                    let hasProgressBar =
                        (me.backgroundDelay || me.showProgress || me.showTaskViewer) &&
                        response.result.data;

                    me.apiCallDone(true, response, options);

                    if (hasProgressBar) {
                        // only hide to allow delaying our close event until task is done
                        me.hide();

                        let upid = response.result.data;
                        let viewerClass = me.showTaskViewer ? 'Viewer' : 'Progress';
                        Ext.create('Proxmox.window.Task' + viewerClass, {
                            autoShow: true,
                            upid: upid,
                            taskDone: me.taskDone,
                            listeners: {
                                destroy: function () {
                                    me.close();
                                },
                            },
                        });
                    } else {
                        me.close();
                    }
                },
            },
            me.submitOptions ?? {},
        );
        Proxmox.Utils.API2Request(requestOptions);
    },

    load: function (options) {
        let me = this;

        let form = me.formPanel.getForm();

        options = options || {};

        let newopts = Ext.apply(
            {
                waitMsgTarget: me,
            },
            options,
        );

        if (Object.keys(me.extraRequestParams).length > 0) {
            let params = newopts.params || {};
            Ext.applyIf(params, me.extraRequestParams);
            newopts.params = params;
        }

        let url = Ext.isFunction(me.loadUrl)
            ? me.loadUrl(me.url, me.initialConfig)
            : me.loadUrl || me.url;

        let createWrapper = function (successFn) {
            Ext.apply(newopts, {
                url: url,
                method: 'GET',
                success: function (response, opts) {
                    form.clearInvalid();
                    me.digest = response.result?.digest || response.result?.data?.digest;
                    if (successFn) {
                        successFn(response, opts);
                    } else {
                        me.setValues(response.result.data);
                    }
                    // hack: fix ExtJS bug
                    Ext.Array.each(me.query('radiofield'), (f) => f.resetOriginalValue());
                },
                failure: function (response, opts) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus, function () {
                        me.close();
                    });
                },
            });
        };

        createWrapper(options.success);

        Proxmox.Utils.API2Request(newopts);
    },

    initComponent: function () {
        let me = this;

        if (
            !me.url &&
            (!me.submitUrl ||
                !me.loadUrl ||
                me.submitUrl === Ext.identityFn ||
                me.loadUrl === Ext.identityFn)
        ) {
            throw "neither 'url' nor both, submitUrl and loadUrl specified";
        }
        if (me.create) {
            throw 'deprecated parameter, use isCreate';
        }

        let items = Ext.isArray(me.items) ? me.items : [me.items];

        me.items = undefined;

        me.formPanel = Ext.create('Ext.form.Panel', {
            url: me.url, // FIXME: not in 'form' class, safe to remove??
            method: me.method || 'PUT',
            trackResetOnLoad: true,
            bodyPadding: me.bodyPadding !== undefined ? me.bodyPadding : 10,
            border: false,
            defaults: Ext.apply({}, me.defaults, {
                border: false,
            }),
            fieldDefaults: Ext.apply({}, me.fieldDefaults, {
                labelWidth: 100,
                anchor: '100%',
            }),
            items: items,
        });

        let inputPanel = me.formPanel.down('inputpanel');

        let form = me.formPanel.getForm();

        let submitText;
        if (me.isCreate) {
            if (me.submitText) {
                submitText = me.submitText;
            } else if (me.isAdd) {
                submitText = gettext('Add');
            } else if (me.isRemove) {
                submitText = gettext('Remove');
            } else {
                submitText = gettext('Create');
            }
        } else {
            submitText = me.submitText || gettext('OK');
        }

        let submitBtn = Ext.create('Ext.Button', {
            reference: 'submitbutton',
            text: submitText,
            disabled: !me.isCreate,
            handler: function () {
                me.submit();
            },
        });

        let resetTool = Ext.create('Ext.panel.Tool', {
            glyph: 'xf0e2@FontAwesome', // fa-undo
            tooltip: gettext('Reset form data'),
            callback: () => form.reset(),
            style: {
                paddingRight: '2px', // just slightly more room to breathe
            },
            disabled: true,
        });

        let set_button_status = function () {
            let valid = form.isValid();
            let dirty = form.isDirty();
            submitBtn.setDisabled(!valid || !(dirty || me.isCreate));
            resetTool.setDisabled(!dirty);
        };

        form.on('dirtychange', set_button_status);
        form.on('validitychange', set_button_status);

        let colwidth = 300;
        if (me.fieldDefaults && me.fieldDefaults.labelWidth) {
            colwidth += me.fieldDefaults.labelWidth - 100;
        }

        let twoColumn = inputPanel && (inputPanel.column1 || inputPanel.column2);

        if (me.subject && !me.title) {
            me.title = Proxmox.Utils.dialog_title(me.subject, me.isCreate, me.isAdd);
        }

        me.buttons = [submitBtn];

        if (!me.isCreate && me.showReset) {
            me.tools = [resetTool];
        }

        if (inputPanel && inputPanel.hasAdvanced) {
            let sp = Ext.state.Manager.getProvider();
            let advchecked = sp.get('proxmox-advanced-cb');
            inputPanel.setAdvancedVisible(advchecked);
            me.buttons.unshift({
                xtype: 'proxmoxcheckbox',
                itemId: 'advancedcb',
                boxLabelAlign: 'before',
                boxLabel: gettext('Advanced'),
                stateId: 'proxmox-advanced-cb',
                value: advchecked,
                listeners: {
                    change: function (cb, val) {
                        inputPanel.setAdvancedVisible(val);
                        sp.set('proxmox-advanced-cb', val);
                    },
                },
            });
        }

        let onlineHelp = me.onlineHelp;
        if (!onlineHelp && inputPanel && inputPanel.onlineHelp) {
            onlineHelp = inputPanel.onlineHelp;
        }

        if (onlineHelp) {
            let helpButton = Ext.create('Proxmox.button.Help');
            me.buttons.unshift(helpButton, '->');
            Ext.GlobalEvents.fireEvent('proxmoxShowHelp', onlineHelp);
        }

        Ext.applyIf(me, {
            modal: true,
            width: twoColumn ? colwidth * 2 : colwidth,
            border: false,
            items: [me.formPanel],
        });

        me.callParent();

        if (inputPanel?.hasAdvanced) {
            let advancedItems = inputPanel.down('#advancedContainer').query('field');
            advancedItems.forEach(function (field) {
                me.mon(field, 'validitychange', (f, valid) => {
                    if (!valid) {
                        f.up('inputpanel').setAdvancedVisible(true);
                    }
                });
            });
        }

        // always mark invalid fields
        me.on('afterlayout', function () {
            // on touch devices, the isValid function
            // triggers a layout, which triggers an isValid
            // and so on
            // to prevent this we disable the layouting here
            // and enable it afterwards
            me.suspendLayout = true;
            me.isValid();
            me.suspendLayout = false;
        });

        if (me.autoLoad) {
            me.load(me.autoLoadOptions);
        }
    },
});
Ext.define('Proxmox.window.PasswordEdit', {
    extend: 'Proxmox.window.Edit',
    alias: 'proxmoxWindowPasswordEdit',
    mixins: ['Proxmox.Mixin.CBind'],

    subject: gettext('Password'),

    url: '/api2/extjs/access/password',

    width: 380,
    fieldDefaults: {
        labelWidth: 150,
    },

    // specifies the minimum length of *new* passwords so this can be
    // adapted by each product as limits are changed there.
    minLength: 5,

    // allow products to opt-in as their API gains support for this.
    confirmCurrentPassword: false,

    hintHtml: undefined,

    items: [
        {
            xtype: 'textfield',
            inputType: 'password',
            fieldLabel: gettext('Your Current Password'),
            reference: 'confirmation-password',
            name: 'confirmation-password',
            allowBlank: false,
            vtype: 'password',
            cbind: {
                hidden: '{!confirmCurrentPassword}',
                disabled: '{!confirmCurrentPassword}',
            },
        },
        {
            xtype: 'textfield',
            inputType: 'password',
            fieldLabel: gettext('New Password'),
            allowBlank: false,
            name: 'password',
            listeners: {
                change: (field) => field.next().validate(),
                blur: (field) => field.next().validate(),
            },
            cbind: {
                minLength: '{minLength}',
            },
        },
        {
            xtype: 'textfield',
            inputType: 'password',
            fieldLabel: gettext('Confirm New Password'),
            name: 'verifypassword',
            allowBlank: false,
            vtype: 'password',
            initialPassField: 'password',
            submitValue: false,
        },
        {
            xtype: 'component',
            userCls: 'pmx-hint',
            name: 'password-hint',
            hidden: true,
            //padding: '5 1',
            cbind: {
                html: '{hintHtml}',
                hidden: '{!hintHtml}',
            },
        },
        {
            xtype: 'hiddenfield',
            name: 'userid',
            cbind: {
                value: '{userid}',
            },
        },
    ],
});
// Pop-up a message window where the user has to confirm their intent to delete an item.
// Optionally, an additional textfield can be added, requiring the user to enter the ID
// of the given item again to confirm their intent.
Ext.define('Proxmox.window.ConfirmRemoveDialog', {
    extend: 'Ext.window.Window',
    alias: 'widget.proxmoxConfirmRemoveDialog',

    title: gettext('Confirm'),
    modal: true,
    buttonAlign: 'center',
    bodyPadding: 10,
    width: 450,
    layout: { type: 'hbox' },
    defaultFocus: 'confirmField',
    showProgress: false,

    // if set to true, a warning sign will be displayed and entering the ID will
    // be required before removal is possible. If set to false, a question mark
    // will be displayed.
    dangerous: false,

    confirmButtonText: gettext('Yes'),
    // second button will only be displayed if a text is given
    declineButtonText: gettext('No'),

    additionalItems: [],

    // gets called if we have a progress bar or taskview and it detected that
    // the task finished. function(success)
    taskDone: Ext.emptyFn,

    // gets called when the api call is finished, right at the beginning
    // function(success, response, options)
    apiCallDone: Ext.emptyFn,

    config: {
        item: {
            id: undefined,
        },
        text: undefined,
        url: undefined,
        note: undefined,
        params: {},
    },

    getParams: function () {
        let me = this;

        if (Ext.Object.isEmpty(me.params)) {
            return '';
        }
        return '?' + Ext.Object.toQueryString(me.params);
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        control: {
            'field[name=confirm]': {
                change: function (f, value) {
                    const view = this.getView();
                    const confirmButton = this.lookupReference('confirmButton');
                    if (value === view.getItem().id.toString()) {
                        confirmButton.enable();
                    } else {
                        confirmButton.disable();
                    }
                },
                specialkey: function (field, event) {
                    const confirmButton = this.lookupReference('confirmButton');
                    if (!confirmButton.isDisabled() && event.getKey() === event.ENTER) {
                        confirmButton.fireEvent('click', confirmButton, event);
                    }
                },
            },
            'button[reference=confirmButton]': {
                click: function () {
                    const view = this.getView();
                    Proxmox.Utils.API2Request({
                        url: view.getUrl() + view.getParams(),
                        method: 'DELETE',
                        waitMsgTarget: view,
                        failure: function (response, opts) {
                            view.apiCallDone(false, response, opts);
                            view.close();
                            Ext.Msg.alert('Error', response.htmlStatus);
                        },
                        success: function (response, options) {
                            const hasProgressBar = !!(view.showProgress && response.result.data);

                            view.apiCallDone(true, response, options);

                            if (hasProgressBar) {
                                // stay around so we can trigger our close events
                                // when background action is completed
                                view.hide();

                                const upid = response.result.data;
                                const win = Ext.create('Proxmox.window.TaskProgress', {
                                    upid: upid,
                                    taskDone: view.taskDone,
                                    listeners: {
                                        destroy: function () {
                                            view.close();
                                        },
                                    },
                                });
                                win.show();
                            } else {
                                view.close();
                            }
                        },
                    });
                },
            },
            'button[reference=declineButton]': {
                click: function () {
                    const view = this.getView();
                    view.close();
                },
            },
        },
    },

    initComponent: function () {
        let me = this;

        let cls = [Ext.baseCSSPrefix + 'message-box-icon', Ext.baseCSSPrefix + 'dlg-icon'];
        if (me.dangerous) {
            cls.push(Ext.baseCSSPrefix + 'message-box-warning');
        } else {
            cls.push(Ext.baseCSSPrefix + 'message-box-question');
        }

        let body = {
            xtype: 'container',
            layout: 'hbox',
            items: [
                {
                    xtype: 'component',
                    cls: cls,
                },
            ],
        };

        const itemId = me.getItem().id;
        if (!Ext.isDefined(itemId)) {
            throw 'no ID specified';
        }

        let content = {
            xtype: 'container',
            layout: 'vbox',
            items: [
                {
                    xtype: 'component',
                    reference: 'messageCmp',
                    html: Ext.htmlEncode(me.getText()),
                },
            ],
        };

        if (me.dangerous) {
            let label = `${gettext('Please enter the ID to confirm')} (${itemId})`;
            content.items.push({
                itemId: 'confirmField',
                reference: 'confirmField',
                xtype: 'textfield',
                name: 'confirm',
                padding: '5 0 0 0',
                width: 340,
                labelWidth: 240,
                fieldLabel: label,
                hideTrigger: true,
                allowBlank: false,
            });
        }

        if (me.additionalItems && me.additionalItems.length > 0) {
            content.items.push({
                xtype: 'container',
                height: 5,
            });
            for (const item of me.additionalItems) {
                content.items.push(item);
            }
        }

        if (Ext.isDefined(me.getNote())) {
            content.items.push({
                xtype: 'container',
                reference: 'noteContainer',
                flex: 1,
                layout: {
                    type: 'vbox',
                },
                items: [
                    {
                        xtype: 'component',
                        reference: 'noteCmp',
                        userCls: 'pmx-hint',
                        html: `<span title="${me.getNote()}">${me.getNote()}</span>`,
                    },
                ],
            });
        }

        body.items.push(content);

        me.items = [body];

        let buttons = [
            {
                xtype: 'button',
                reference: 'confirmButton',
                text: me.confirmButtonText,
                disabled: me.dangerous,
                width: 75,
                margin: '0 5 0 0',
            },
        ];

        if (me.declineButtonText) {
            buttons.push({
                xtype: 'button',
                reference: 'declineButton',
                text: me.declineButtonText,
                width: 75,
            });
        }

        me.dockedItems = [
            {
                xtype: 'container',
                dock: 'bottom',
                cls: ['x-toolbar', 'x-toolbar-footer'],
                layout: {
                    type: 'hbox',
                    pack: 'center',
                },
                items: buttons,
            },
        ];

        me.callParent();
    },
});
// Pop-up a message window where the user has to manually enter the resource ID to enable the
// destroy confirmation button to ensure that they got the correct resource selected for.
Ext.define('Proxmox.window.SafeDestroy', {
    extend: 'Proxmox.window.ConfirmRemoveDialog',
    alias: 'widget.proxmoxSafeDestroy',

    dangerous: true,

    confirmButtonText: gettext('Remove'),
    // second button will only be displayed if a text is given
    declineButtonText: undefined,

    config: {
        item: {
            id: undefined,
            formattedIdentifier: undefined,
        },
        taskName: undefined,
    },

    getText: function () {
        let me = this;

        let identifier = me.getItem().formattedIdentifier ?? me.getItem().id;
        me.text = `${Proxmox.Utils.format_task_description(me.getTaskName(), identifier)}`;

        return me.callParent();
    },
});
Ext.define('Proxmox.window.PackageVersions', {
    extend: 'Ext.window.Window',
    alias: 'widget.proxmoxPackageVersions',

    title: gettext('Package versions'),
    width: 600,
    height: 650,
    layout: 'fit',
    modal: true,

    url: `/nodes/localhost/apt/versions`,

    viewModel: {
        parent: null,
        data: {
            packageList: '',
        },
    },
    buttons: [
        {
            xtype: 'button',
            text: gettext('Copy'),
            iconCls: 'fa fa-clipboard',
            handler: function (button) {
                window.getSelection().selectAllChildren(document.getElementById('pkgversions'));
                document.execCommand('copy');
            },
        },
        {
            text: gettext('Ok'),
            handler: function () {
                this.up('window').close();
            },
        },
    ],
    items: [
        {
            xtype: 'component',
            autoScroll: true,
            id: 'pkgversions',
            padding: 5,
            bind: {
                html: '{packageList}',
            },
            style: {
                'white-space': 'pre',
                'font-family': 'monospace',
            },
        },
    ],
    listeners: {
        afterrender: function () {
            this.loadPackageVersions(); // wait for after render so that we can show a load mask
        },
    },

    loadPackageVersions: async function () {
        let me = this;

        let { result } = await Proxmox.Async.api2({
            waitMsgTarget: me.down('component[id="pkgversions"]'),
            method: 'GET',
            url: me.url,
        }).catch(Proxmox.Utils.alertResponseFailure); // FIXME: mask window instead?

        let text = '';
        for (const pkg of result.data) {
            let version = 'not correctly installed';
            if (pkg.OldVersion && pkg.OldVersion !== 'unknown') {
                version = pkg.OldVersion;
            } else if (pkg.CurrentState === 'ConfigFiles') {
                version = 'residual config';
            }
            const name = pkg.Package;
            if (pkg.ExtraInfo) {
                text += `${name}: ${version} (${pkg.ExtraInfo})\n`;
            } else {
                text += `${name}: ${version}\n`;
            }
        }
        me.getViewModel().set('packageList', Ext.htmlEncode(text));
    },
});
Ext.define('Proxmox.window.TaskProgress', {
    extend: 'Ext.window.Window',
    alias: 'widget.proxmoxTaskProgress',

    taskDone: Ext.emptyFn,

    width: 300,
    layout: 'auto',
    modal: true,
    bodyPadding: 5,

    initComponent: function () {
        let me = this;

        if (!me.upid) {
            throw 'no task specified';
        }

        let task = Proxmox.Utils.parse_task_upid(me.upid);

        let statstore = Ext.create('Proxmox.data.ObjectStore', {
            url: `/api2/json/nodes/${task.node}/tasks/${encodeURIComponent(me.upid)}/status`,
            interval: 1000,
            rows: {
                status: { defaultValue: 'unknown' },
                exitstatus: { defaultValue: 'unknown' },
            },
        });

        me.on('destroy', statstore.stopUpdate);

        let getObjectValue = function (key, defaultValue) {
            let rec = statstore.getById(key);
            if (rec) {
                return rec.data.value;
            }
            return defaultValue;
        };

        let pbar = Ext.create('Ext.ProgressBar');

        me.mon(statstore, 'load', function () {
            let status = getObjectValue('status');
            if (status === 'stopped') {
                let exitstatus = getObjectValue('exitstatus');
                if (exitstatus === 'OK') {
                    pbar.reset();
                    pbar.updateText('Done!');
                    Ext.Function.defer(me.close, 1000, me);
                } else {
                    me.close();
                    Ext.Msg.alert('Task failed', Ext.htmlEncode(exitstatus));
                }
                me.taskDone(exitstatus === 'OK');
            }
        });

        let descr = Ext.htmlEncode(Proxmox.Utils.format_task_description(task.type, task.id));

        Ext.apply(me, {
            title: gettext('Task') + ': ' + descr,
            items: pbar,
            buttons: [
                {
                    text: gettext('Details'),
                    handler: function () {
                        Ext.create('Proxmox.window.TaskViewer', {
                            autoShow: true,
                            taskDone: me.taskDone,
                            upid: me.upid,
                        });
                        me.close();
                    },
                },
            ],
        });

        me.callParent();

        statstore.startUpdate();

        pbar.wait({ text: gettext('running...') });
    },
});

Ext.define('Proxmox.window.TaskViewer', {
    extend: 'Ext.window.Window',
    alias: 'widget.proxmoxTaskViewer',

    extraTitle: '', // string to prepend after the generic task title

    taskDone: Ext.emptyFn,

    initComponent: function () {
        let me = this;

        if (!me.upid) {
            throw 'no task specified';
        }

        let task = Proxmox.Utils.parse_task_upid(me.upid);

        let statgrid;

        let rows = {
            status: {
                header: gettext('Status'),
                defaultValue: 'unknown',
                renderer: function (value) {
                    if (value !== 'stopped') {
                        return Ext.htmlEncode(value);
                    }
                    let es = statgrid.getObjectValue('exitstatus');
                    if (es) {
                        return Ext.htmlEncode(`${value}: ${es}`);
                    }
                    return 'unknown';
                },
            },
            exitstatus: {
                visible: false,
                renderer: Ext.String.htmlEncode,
            },
            type: {
                header: gettext('Task type'),
                required: true,
                renderer: Ext.String.htmlEncode,
            },
            user: {
                header: gettext('User name'),
                renderer: function (value) {
                    let user = value;
                    let tokenid = statgrid.getObjectValue('tokenid');
                    if (tokenid) {
                        user += `!${tokenid} (API Token)`;
                    }
                    return Ext.String.htmlEncode(user);
                },
                required: true,
            },
            tokenid: {
                header: gettext('API Token'),
                renderer: Ext.String.htmlEncode,
                visible: false,
            },
            node: {
                header: gettext('Node'),
                required: true,
                renderer: Ext.String.htmlEncode,
            },
            pid: {
                header: gettext('Process ID'),
                required: true,
                renderer: Ext.String.htmlEncode,
            },
            task_id: {
                header: gettext('Task ID'),
                renderer: Ext.String.htmlEncode,
            },
            starttime: {
                header: gettext('Start Time'),
                required: true,
                renderer: Proxmox.Utils.render_timestamp,
            },
            upid: {
                header: gettext('Unique task ID'),
                renderer: Ext.String.htmlEncode,
            },
        };

        if (me.endtime) {
            if (typeof me.endtime === 'object') {
                // convert to epoch
                me.endtime = parseInt(me.endtime.getTime() / 1000, 10);
            }
            rows.endtime = {
                header: gettext('End Time'),
                required: true,
                renderer: function () {
                    return Proxmox.Utils.render_timestamp(me.endtime);
                },
            };
        }

        rows.duration = {
            header: gettext('Duration'),
            required: true,
            renderer: function () {
                let starttime = statgrid.getObjectValue('starttime');
                let endtime = me.endtime || Date.now() / 1000;
                let duration = endtime - starttime;
                return Proxmox.Utils.format_duration_human(duration);
            },
        };

        let statstore = Ext.create('Proxmox.data.ObjectStore', {
            url: `/api2/json/nodes/${task.node}/tasks/${encodeURIComponent(me.upid)}/status`,
            interval: 1000,
            rows: rows,
        });

        me.on('destroy', statstore.stopUpdate);

        let stop_task = function () {
            Proxmox.Utils.API2Request({
                url: `/nodes/${task.node}/tasks/${encodeURIComponent(me.upid)}`,
                waitMsgTarget: me,
                method: 'DELETE',
                failure: (response) => Ext.Msg.alert(gettext('Error'), response.htmlStatus),
            });
        };

        let stop_btn1 = new Ext.Button({
            text: gettext('Stop'),
            disabled: true,
            handler: stop_task,
        });

        let stop_btn2 = new Ext.Button({
            text: gettext('Stop'),
            disabled: true,
            handler: stop_task,
        });

        statgrid = Ext.create('Proxmox.grid.ObjectGrid', {
            title: gettext('Status'),
            layout: 'fit',
            tbar: [stop_btn1],
            rstore: statstore,
            rows: rows,
            border: false,
        });

        let downloadBtn = new Ext.Button({
            text: gettext('Download'),
            iconCls: 'fa fa-download',
            handler: () =>
                Proxmox.Utils.downloadAsFile(
                    `/api2/json/nodes/${task.node}/tasks/${encodeURIComponent(me.upid)}/log?download=1`,
                ),
        });

        let logView = Ext.create('Proxmox.panel.LogView', {
            title: gettext('Output'),
            tbar: [stop_btn2, '->', downloadBtn],
            border: false,
            url: `/api2/extjs/nodes/${task.node}/tasks/${encodeURIComponent(me.upid)}/log`,
        });

        me.mon(statstore, 'load', function () {
            let status = statgrid.getObjectValue('status');

            if (status === 'stopped') {
                logView.scrollToEnd = false;
                logView.requestUpdate();
                statstore.stopUpdate();
                me.taskDone(statgrid.getObjectValue('exitstatus') === 'OK');
            }

            stop_btn1.setDisabled(status !== 'running');
            stop_btn2.setDisabled(status !== 'running');
            downloadBtn.setDisabled(status === 'running');
        });

        statstore.startUpdate();

        Ext.apply(me, {
            title: Ext.htmlEncode('Task viewer: ' + task.desc + me.extraTitle),
            width: 800,
            height: 500,
            layout: 'fit',
            modal: true,
            items: [
                {
                    xtype: 'tabpanel',
                    region: 'center',
                    items: [logView, statgrid],
                },
            ],
        });

        me.callParent();

        logView.fireEvent('show', logView);
    },
});
Ext.define('Proxmox.window.LanguageEditWindow', {
    extend: 'Ext.window.Window',
    alias: 'widget.pmxLanguageEditWindow',

    viewModel: {
        parent: null,
        data: {
            language: '__default__',
        },
    },
    controller: {
        xclass: 'Ext.app.ViewController',
        init: function (view) {
            let language = Ext.util.Cookies.get(view.cookieName) || '__default__';
            if (language === 'kr') {
                // fix-up wrongly used Korean code before FIXME: remove with trixie releases
                language = 'ko';
                let expire = Ext.Date.add(new Date(), Ext.Date.YEAR, 10);
                Ext.util.Cookies.set(view.cookieName, language, expire);
            }
            this.getViewModel().set('language', language);
        },
        applyLanguage: function (button) {
            let view = this.getView();
            let vm = this.getViewModel();

            let expire = Ext.Date.add(new Date(), Ext.Date.YEAR, 10);
            Ext.util.Cookies.set(view.cookieName, vm.get('language'), expire);
            view.mask(gettext('Please wait...'), 'x-mask-loading');
            window.location.reload();
        },
    },

    cookieName: 'PVELangCookie',

    title: gettext('Language'),
    modal: true,
    bodyPadding: 10,
    resizable: false,
    items: [
        {
            xtype: 'proxmoxLanguageSelector',
            fieldLabel: gettext('Language'),
            labelWidth: 75,
            bind: {
                value: '{language}',
            },
        },
    ],
    buttons: [
        {
            text: gettext('Apply'),
            handler: 'applyLanguage',
        },
    ],
});
Ext.define(
    'Proxmox.window.DiskSmart',
    {
        extend: 'Ext.window.Window',
        alias: 'widget.pmxSmartWindow',

        modal: true,

        layout: {
            type: 'fit',
        },
        width: 800,
        height: 500,
        minWidth: 400,
        minHeight: 300,
        bodyPadding: 5,

        items: [
            {
                xtype: 'gridpanel',
                layout: {
                    type: 'fit',
                },
                emptyText: gettext('No S.M.A.R.T. Values'),
                scrollable: true,
                flex: 1,
                itemId: 'smartGrid',
                reserveScrollbar: true,
                columns: [
                    {
                        text: 'ID',
                        dataIndex: 'id',
                        width: 50,
                        align: 'right',
                    },
                    {
                        text: gettext('Attribute'),
                        dataIndex: 'name',
                        flex: 1,
                        renderer: Ext.String.htmlEncode,
                    },
                    {
                        text: gettext('Value'),
                        dataIndex: 'real-value',
                        renderer: Ext.String.htmlEncode,
                    },
                    {
                        text: gettext('Normalized'),
                        dataIndex: 'real-normalized',
                        width: 60,
                        align: 'right',
                    },
                    {
                        text: gettext('Threshold'),
                        dataIndex: 'threshold',
                        width: 60,
                        align: 'right',
                    },
                    {
                        text: gettext('Worst'),
                        dataIndex: 'worst',
                        width: 60,
                        align: 'right',
                    },
                    {
                        text: gettext('Flags'),
                        dataIndex: 'flags',
                    },
                    {
                        text: gettext('Failing'),
                        dataIndex: 'fail',
                        renderer: Ext.String.htmlEncode,
                    },
                ],
            },
            {
                xtype: 'component',
                itemId: 'smartPlainText',
                hidden: true,
                autoScroll: true,
                padding: 5,
                style: {
                    'white-space': 'pre',
                    'font-family': 'monospace',
                },
            },
        ],

        buttons: [
            {
                text: gettext('Reload'),
                name: 'reload',
                handler: function () {
                    var me = this;
                    me.up('window').store.reload();
                },
            },
            {
                text: gettext('Close'),
                name: 'close',
                handler: function () {
                    var me = this;
                    me.up('window').close();
                },
            },
        ],

        initComponent: function () {
            let me = this;

            if (!me.baseurl) {
                throw 'no baseurl specified';
            }
            if (!me.dev) {
                throw 'no device specified';
            }

            me.title = `${gettext('S.M.A.R.T. Values')} (${me.dev})`;

            me.store = Ext.create('Ext.data.Store', {
                model: 'pmx-disk-smart',
                proxy: {
                    type: 'proxmox',
                    url: `${me.baseurl}/smart?disk=${me.dev}`,
                },
            });

            me.callParent();

            let grid = me.down('#smartGrid'),
                plainText = me.down('#smartPlainText');

            Proxmox.Utils.monStoreErrors(grid, me.store);
            me.mon(me.store, 'load', function (_store, records, success) {
                if (!success || records.length <= 0) {
                    return; // FIXME: clear displayed info?
                }
                let isPlainText = records[0].data.type === 'text';
                if (isPlainText) {
                    plainText.setHtml(Ext.String.htmlEncode(records[0].data.text));
                } else {
                    grid.setStore(records[0].attributes());
                }
                grid.setVisible(!isPlainText);
                plainText.setVisible(isPlainText);
            });

            me.store.load();
        },
    },
    function () {
        Ext.define('pmx-disk-smart', {
            extend: 'Ext.data.Model',
            fields: [{ name: 'health' }, { name: 'type' }, { name: 'text' }],
            hasMany: { model: 'pmx-smart-attribute', name: 'attributes' },
        });
        Ext.define('pmx-smart-attribute', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'id', type: 'number' },
                'name',
                'value',
                'worst',
                'threshold',
                'flags',
                'fail',
                'raw',
                'normalized',
                {
                    name: 'real-value',
                    // FIXME remove with next major release (PBS 3.0)
                    calculate: (data) => data.raw ?? data.value,
                },
                {
                    name: 'real-normalized',
                    // FIXME remove with next major release (PBS 3.0)
                    calculate: (data) => data.normalized ?? data.value,
                },
            ],
            idProperty: 'name',
        });
    },
);
Ext.define('Proxmox.window.ZFSDetail', {
    extend: 'Ext.window.Window',
    alias: 'widget.pmxZFSDetail',
    mixins: ['Proxmox.Mixin.CBind'],

    cbindData: function (initialConfig) {
        let me = this;
        me.url = `/nodes/${me.nodename}/disks/zfs/${encodeURIComponent(me.zpool)}`;
        return {
            zpoolUri: `/api2/json/${me.url}`,
            title: `${gettext('Status')}: ${me.zpool}`,
        };
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        reload: function () {
            let me = this;
            let view = me.getView();
            me.lookup('status').reload();

            Proxmox.Utils.API2Request({
                url: `/api2/extjs/${view.url}`,
                waitMsgTarget: view,
                method: 'GET',
                failure: function (response, opts) {
                    Proxmox.Utils.setErrorMask(view, response.htmlStatus);
                },
                success: function (response, opts) {
                    let devices = me.lookup('devices');
                    devices.getSelectionModel().deselectAll();
                    devices.setRootNode(response.result.data);
                    devices.expandAll();
                },
            });
        },

        init: function (view) {
            let me = this;
            Proxmox.Utils.monStoreErrors(me, me.lookup('status').getStore().rstore);
            me.reload();
        },
    },

    modal: true,
    width: 800,
    height: 600,
    resizable: true,
    cbind: {
        title: '{title}',
    },

    layout: {
        type: 'vbox',
        align: 'stretch',
    },
    defaults: {
        layout: 'fit',
        border: false,
    },

    tbar: [
        {
            text: gettext('Reload'),
            iconCls: 'fa fa-refresh',
            handler: 'reload',
        },
    ],

    items: [
        {
            xtype: 'proxmoxObjectGrid',
            reference: 'status',
            flex: 0,
            cbind: {
                url: '{zpoolUri}',
                nodename: '{nodename}',
            },
            rows: {
                state: {
                    header: gettext('Health'),
                    renderer: Proxmox.Utils.render_zfs_health,
                },
                scan: {
                    header: gettext('Scan'),
                },
                status: {
                    header: gettext('Status'),
                },
                action: {
                    header: gettext('Action'),
                },
                errors: {
                    header: gettext('Errors'),
                },
            },
        },
        {
            xtype: 'treepanel',
            reference: 'devices',
            title: gettext('Devices'),
            stateful: true,
            stateId: 'grid-node-zfsstatus',
            // the root is the pool itself and the information is shown by the grid
            rootVisible: false,
            fields: [
                'name',
                'status',
                {
                    type: 'string',
                    name: 'iconCls',
                    calculate: function (data) {
                        var txt = 'fa x-fa-tree fa-';
                        if (data.leaf) {
                            return txt + 'hdd-o';
                        }
                        return undefined;
                    },
                },
            ],
            sorters: 'name',
            flex: 1,
            cbind: {
                zpool: '{zpoolUri}',
                nodename: '{nodename}',
            },
            columns: [
                {
                    xtype: 'treecolumn',
                    text: gettext('Name'),
                    dataIndex: 'name',
                    flex: 1,
                },
                {
                    text: gettext('Health'),
                    renderer: Proxmox.Utils.render_zfs_health,
                    dataIndex: 'state',
                },
                {
                    text: 'READ',
                    dataIndex: 'read',
                },
                {
                    text: 'WRITE',
                    dataIndex: 'write',
                },
                {
                    text: 'CKSUM',
                    dataIndex: 'cksum',
                },
                {
                    text: gettext('Message'),
                    dataIndex: 'msg',
                },
            ],
        },
    ],
});
Ext.define('Proxmox.window.CertificateViewer', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmxCertViewer',

    title: gettext('Certificate'),

    fieldDefaults: {
        labelWidth: 120,
    },
    width: 800,
    resizable: true,

    items: [
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Name'),
            name: 'filename',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Fingerprint'),
            name: 'fingerprint',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Issuer'),
            name: 'issuer',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Subject'),
            name: 'subject',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Public Key Type'),
            name: 'public-key-type',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Public Key Size'),
            name: 'public-key-bits',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Valid Since'),
            renderer: Proxmox.Utils.render_timestamp,
            name: 'notbefore',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Expires'),
            renderer: Proxmox.Utils.render_timestamp,
            name: 'notafter',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Subject Alternative Names'),
            name: 'san',
            renderer: Proxmox.Utils.render_san,
        },
        {
            xtype: 'textarea',
            editable: false,
            grow: true,
            growMax: 200,
            fieldLabel: gettext('Certificate'),
            name: 'pem',
        },
    ],

    initComponent: function () {
        var me = this;

        if (!me.cert) {
            throw 'no cert given';
        }

        if (!me.url) {
            throw 'no url given';
        }

        me.callParent();

        // hide OK/Reset button, because we just want to show data
        me.down('toolbar[dock=bottom]').setVisible(false);

        me.load({
            success: function (response) {
                if (Ext.isArray(response.result.data)) {
                    Ext.Array.each(response.result.data, function (item) {
                        if (item.filename === me.cert) {
                            me.setValues(item);
                            return false;
                        }
                        return true;
                    });
                }
            },
        });
    },
});

Ext.define('Proxmox.window.CertificateUpload', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmxCertUpload',

    title: gettext('Upload Custom Certificate'),
    resizable: false,
    isCreate: true,
    submitText: gettext('Upload'),
    method: 'POST',
    width: 600,

    // whether the UI needs a reload after this
    reloadUi: undefined,

    apiCallDone: function (success, response, options) {
        let me = this;

        if (!success || !me.reloadUi) {
            return;
        }

        Ext.getBody().mask(
            gettext(
                'API server will be restarted to use new certificates, please reload web-interface!',
            ),
            ['pve-static-mask'],
        );
        // try to reload after 10 seconds automatically
        Ext.defer(() => window.location.reload(true), 10000);
    },

    items: [
        {
            fieldLabel: gettext('Private Key (Optional)'),
            labelAlign: 'top',
            emptyText: gettext('No change'),
            name: 'key',
            xtype: 'textarea',
        },
        {
            xtype: 'filebutton',
            text: gettext('From File'),
            listeners: {
                change: function (btn, e, value) {
                    let form = this.up('form');
                    e = e.event;
                    Ext.Array.each(e.target.files, function (file) {
                        Proxmox.Utils.loadTextFromFile(
                            file,
                            function (res) {
                                form.down('field[name=key]').setValue(res);
                            },
                            16384,
                        );
                    });
                    btn.reset();
                },
            },
        },
        {
            xtype: 'box',
            autoEl: 'hr',
        },
        {
            fieldLabel: gettext('Certificate Chain'),
            labelAlign: 'top',
            allowBlank: false,
            name: 'certificates',
            xtype: 'textarea',
        },
        {
            xtype: 'filebutton',
            text: gettext('From File'),
            listeners: {
                change: function (btn, e, value) {
                    let form = this.up('form');
                    e = e.event;
                    Ext.Array.each(e.target.files, function (file) {
                        Proxmox.Utils.loadTextFromFile(
                            file,
                            function (res) {
                                form.down('field[name=certificates]').setValue(res);
                            },
                            16384,
                        );
                    });
                    btn.reset();
                },
            },
        },
        {
            xtype: 'hidden',
            name: 'restart',
            value: '1',
        },
        {
            xtype: 'hidden',
            name: 'force',
            value: '1',
        },
    ],

    initComponent: function () {
        var me = this;

        if (!me.url) {
            throw 'neither url given';
        }

        me.callParent();
    },
});
Ext.define('Proxmox.window.ConsentModal', {
    extend: 'Ext.window.Window',
    alias: ['widget.pmxConsentModal'],
    mixins: ['Proxmox.Mixin.CBind'],

    maxWidth: 1000,
    maxHeight: 1000,
    minWidth: 600,
    minHeight: 400,
    scrollable: true,
    modal: true,
    closable: false,
    resizable: false,
    alwaysOnTop: true,
    title: gettext('Consent'),

    items: [
        {
            xtype: 'displayfield',
            padding: 10,
            scrollable: true,
            cbind: {
                value: '{consent}',
            },
        },
    ],
    buttons: [
        {
            handler: function () {
                this.up('window').close();
            },
            text: gettext('OK'),
        },
    ],

    onResize: function () {
        let me = this;
        let viewportSize = Ext.getBody().getViewSize();

        let originalSize = me.originalSize ?? me.getSize();
        // limit to viewport size - 10px for safety
        let newSize = {
            width: Math.min(originalSize.width, viewportSize.width - 10),
            height: Math.min(originalSize.height, viewportSize.height - 10),
        };

        me.setSize(newSize);
        me.alignTo(Ext.getBody(), 'c-c');
    },

    afterComponentLayout: function (width, height) {
        let me = this;
        me.originalSize ??= { width, height };
    },

    listeners: {
        resize: 'onResize',
    },

    initComponent: function () {
        let me = this;
        me.callParent();
        me.mon(Ext.getBody(), 'resize', me.onResize, me);
    },
});
Ext.define('Proxmox.window.ACMEAccountCreate', {
    extend: 'Proxmox.window.Edit',
    mixins: ['Proxmox.Mixin.CBind'],
    xtype: 'pmxACMEAccountCreate',

    acmeUrl: undefined,

    width: 450,
    title: gettext('Register Account'),
    isCreate: true,
    method: 'POST',
    submitText: gettext('Register'),
    showTaskViewer: true,
    defaultExists: false,

    items: [
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('Account Name'),
            name: 'name',
            cbind: {
                emptyText: (get) => (get('defaultExists') ? '' : 'default'),
                allowBlank: (get) => !get('defaultExists'),
            },
        },
        {
            xtype: 'textfield',
            name: 'contact',
            vtype: 'email',
            allowBlank: false,
            fieldLabel: gettext('E-Mail'),
        },
        {
            xtype: 'proxmoxComboGrid',
            name: 'directory',
            reference: 'directory',
            allowBlank: false,
            valueField: 'url',
            displayField: 'name',
            fieldLabel: gettext('ACME Directory'),
            store: {
                autoLoad: true,
                fields: ['name', 'url'],
                idProperty: ['name'],
                proxy: { type: 'proxmox' },
                sorters: {
                    property: 'name',
                    direction: 'ASC',
                },
            },
            listConfig: {
                columns: [
                    {
                        header: gettext('Name'),
                        dataIndex: 'name',
                        flex: 1,
                    },
                    {
                        header: gettext('URL'),
                        dataIndex: 'url',
                        flex: 1,
                    },
                ],
            },
            listeners: {
                change: function (combogrid, value) {
                    let me = this;

                    if (!value) {
                        return;
                    }

                    let acmeUrl = me.up('window').acmeUrl;

                    let disp = me.up('window').down('#tos_url_display');
                    let field = me.up('window').down('#tos_url');
                    let checkbox = me.up('window').down('#tos_checkbox');

                    disp.setValue(gettext('Loading'));
                    field.setValue(undefined);
                    checkbox.setValue(undefined);
                    checkbox.setHidden(true);

                    Proxmox.Utils.API2Request({
                        url: `${acmeUrl}/tos`,
                        method: 'GET',
                        params: {
                            directory: value,
                        },
                        success: function (response, opt) {
                            field.setValue(response.result.data);
                            disp.setValue(response.result.data);
                            checkbox.setHidden(false);
                        },
                        failure: function (response, opt) {
                            Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                        },
                    });
                },
            },
        },
        {
            xtype: 'displayfield',
            itemId: 'tos_url_display',
            renderer: Proxmox.Utils.render_optional_url,
            name: 'tos_url_display',
        },
        {
            xtype: 'hidden',
            itemId: 'tos_url',
            name: 'tos_url',
        },
        {
            xtype: 'proxmoxcheckbox',
            itemId: 'tos_checkbox',
            boxLabel: gettext('Accept TOS'),
            submitValue: false,
            validateValue: function (value) {
                if (value && this.checked) {
                    return true;
                }
                return false;
            },
        },
    ],

    initComponent: function () {
        let me = this;

        if (!me.acmeUrl) {
            throw 'no acmeUrl given';
        }

        me.url = `${me.acmeUrl}/account`;

        me.callParent();

        me.lookup('directory').store.proxy.setUrl(`/api2/json/${me.acmeUrl}/directories`);
    },
});

Ext.define('Proxmox.window.ACMEAccountView', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmxACMEAccountView',

    width: 600,
    fieldDefaults: {
        labelWidth: 140,
    },

    title: gettext('Account'),

    items: [
        {
            xtype: 'displayfield',
            fieldLabel: gettext('E-Mail'),
            name: 'email',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Created'),
            name: 'createdAt',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Status'),
            name: 'status',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Directory'),
            renderer: Proxmox.Utils.render_optional_url,
            name: 'directory',
        },
        {
            xtype: 'displayfield',
            fieldLabel: gettext('Terms of Services'),
            renderer: Proxmox.Utils.render_optional_url,
            name: 'tos',
        },
    ],

    initComponent: function () {
        var me = this;

        me.callParent();

        // hide OK/Reset button, because we just want to show data
        me.down('toolbar[dock=bottom]').setVisible(false);

        me.load({
            success: function (response) {
                var data = response.result.data;
                data.email = data.account.contact?.[0];
                data.createdAt = data.account.createdAt;
                data.status = data.account.status;
                me.setValues(data);
                me.down('field[name=email]').setHidden(!data.email);
            },
        });
    },
});
Ext.define('Proxmox.window.ACMEPluginEdit', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmxACMEPluginEdit',
    mixins: ['Proxmox.Mixin.CBind'],

    //onlineHelp: 'sysadmin_certs_acme_plugins',

    isAdd: true,
    isCreate: false,

    width: 550,

    acmeUrl: undefined,

    subject: 'ACME DNS Plugin',

    cbindData: function (config) {
        let me = this;
        return {
            challengeSchemaUrl: `/api2/json/${me.acmeUrl}/challenge-schema`,
        };
    },

    items: [
        {
            xtype: 'inputpanel',
            // we dynamically create fields from the given schema
            // things we have to do here:
            // * save which fields we created to remove them again
            // * split the data from the generic 'data' field into the boxes
            // * on deletion collect those values again
            // * save the original values of the data field
            createdFields: {},
            createdInitially: false,
            originalValues: {},
            createSchemaFields: function (schema) {
                let me = this;
                // we know where to add because we define it right below
                let container = me.down('container');
                let datafield = me.down('field[name=data]');
                let hintfield = me.down('field[name=hint]');
                if (!me.createdInitially) {
                    [me.originalValues] = Proxmox.Utils.parseACMEPluginData(datafield.getValue());
                }

                // collect values from custom fields and add it to 'data'',
                // then remove the custom fields
                let data = [];
                for (const [name, field] of Object.entries(me.createdFields)) {
                    let value = field.getValue();
                    if (value !== undefined && value !== null && value !== '') {
                        data.push(`${name}=${value}`);
                    }
                    container.remove(field);
                }
                let datavalue = datafield.getValue();
                if (datavalue !== undefined && datavalue !== null && datavalue !== '') {
                    data.push(datavalue);
                }
                datafield.setValue(data.join('\n'));

                me.createdFields = {};

                if (typeof schema.fields !== 'object') {
                    schema.fields = {};
                }
                // create custom fields according to schema
                let gotSchemaField = false;
                for (const [name, definition] of Object.entries(schema.fields).sort((a, b) =>
                    a[0].localeCompare(b[0]),
                )) {
                    let xtype;
                    switch (definition.type) {
                        case 'string':
                            xtype = 'proxmoxtextfield';
                            break;
                        case 'integer':
                            xtype = 'proxmoxintegerfield';
                            break;
                        case 'number':
                            xtype = 'numberfield';
                            break;
                        default:
                            console.warn(`unknown type '${definition.type}'`);
                            xtype = 'proxmoxtextfield';
                            break;
                    }

                    let label = name;
                    if (typeof definition.name === 'string') {
                        label = definition.name;
                    }

                    let field = Ext.create({
                        xtype,
                        name: `custom_${name}`,
                        fieldLabel: Ext.htmlEncode(label),
                        width: '100%',
                        labelWidth: 150,
                        labelSeparator: '=',
                        emptyText: definition.default || '',
                        autoEl: definition.description
                            ? {
                                  tag: 'div',
                                  'data-qtip': Ext.htmlEncode(
                                      Ext.htmlEncode(definition.description),
                                  ),
                              }
                            : undefined,
                    });

                    me.createdFields[name] = field;
                    container.add(field);
                    gotSchemaField = true;
                }
                datafield.setHidden(gotSchemaField); // prefer schema-fields

                if (schema.description) {
                    hintfield.setValue(schema.description);
                    hintfield.setHidden(false);
                } else {
                    hintfield.setValue('');
                    hintfield.setHidden(true);
                }

                // parse data from field and set it to the custom ones
                let extradata = [];
                [data, extradata] = Proxmox.Utils.parseACMEPluginData(datafield.getValue());
                for (const [key, value] of Object.entries(data)) {
                    if (me.createdFields[key]) {
                        me.createdFields[key].setValue(value);
                        me.createdFields[key].originalValue = me.originalValues[key];
                        me.createdFields[key].checkDirty();
                    } else {
                        extradata.push(`${key}=${value}`);
                    }
                }
                datafield.setValue(extradata.join('\n'));
                if (!me.createdInitially) {
                    datafield.resetOriginalValue();
                    me.createdInitially = true; // save that we initially set that
                }
            },

            onGetValues: function (values) {
                let me = this;
                let win = me.up('pmxACMEPluginEdit');
                if (win.isCreate) {
                    values.id = values.plugin;
                    values.type = 'dns'; // the only one for now
                }
                delete values.plugin;

                Proxmox.Utils.delete_if_default(values, 'validation-delay', '30', win.isCreate);

                let data = '';
                for (const [name, field] of Object.entries(me.createdFields)) {
                    let value = field.getValue();
                    if (value !== null && value !== undefined && value !== '') {
                        data += `${name}=${value}\n`;
                    }
                    delete values[`custom_${name}`];
                }
                values.data = Ext.util.Base64.encode(data + values.data);
                return values;
            },

            items: [
                {
                    xtype: 'pmxDisplayEditField',
                    cbind: {
                        editable: (get) => get('isCreate'),
                        submitValue: (get) => get('isCreate'),
                    },
                    editConfig: {
                        flex: 1,
                        xtype: 'proxmoxtextfield',
                        allowBlank: false,
                    },
                    name: 'plugin',
                    labelWidth: 150,
                    fieldLabel: gettext('Plugin ID'),
                },
                {
                    xtype: 'proxmoxintegerfield',
                    name: 'validation-delay',
                    labelWidth: 150,
                    fieldLabel: gettext('Validation Delay'),
                    emptyText: 30,
                    cbind: {
                        deleteEmpty: '{!isCreate}',
                    },
                    minValue: 0,
                    maxValue: 48 * 60 * 60,
                },
                {
                    xtype: 'pmxACMEApiSelector',
                    name: 'api',
                    labelWidth: 150,
                    cbind: {
                        url: '{challengeSchemaUrl}',
                    },
                    listeners: {
                        change: function (selector) {
                            let schema = selector.getSchema();
                            selector.up('inputpanel').createSchemaFields(schema);
                        },
                    },
                },
                {
                    xtype: 'textarea',
                    fieldLabel: gettext('API Data'),
                    labelWidth: 150,
                    name: 'data',
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: gettext('Hint'),
                    labelWidth: 150,
                    name: 'hint',
                    hidden: true,
                },
            ],
        },
    ],

    initComponent: function () {
        var me = this;

        if (!me.acmeUrl) {
            throw 'no acmeUrl given';
        }

        me.callParent();

        if (!me.isCreate) {
            me.load({
                success: function (response, opts) {
                    me.setValues(response.result.data);
                },
            });
        } else {
            me.method = 'POST';
        }
    },
});
Ext.define('Proxmox.window.ACMEDomainEdit', {
    extend: 'Proxmox.window.Edit',
    xtype: 'pmxACMEDomainEdit',
    mixins: ['Proxmox.Mixin.CBind'],

    subject: gettext('Domain'),
    isCreate: false,
    width: 450,
    //onlineHelp: 'sysadmin_certificate_management',

    acmeUrl: undefined,

    // config url
    url: undefined,

    // For PMG the we have multiple certificates, so we have a "usage" attribute & column.
    domainUsages: undefined,

    // Force the use of 'acmedomainX' properties.
    separateDomainEntries: undefined,

    cbindData: function (config) {
        let me = this;
        return {
            pluginsUrl: `/api2/json/${me.acmeUrl}/plugins`,
            hasUsage: !!me.domainUsages,
        };
    },

    items: [
        {
            xtype: 'inputpanel',
            onGetValues: function (values) {
                let me = this;
                let win = me.up('pmxACMEDomainEdit');
                let nodeconfig = win.nodeconfig;
                let olddomain = win.domain || {};

                let params = {
                    digest: nodeconfig.digest,
                };

                let configkey = olddomain.configkey;
                let acmeObj = Proxmox.Utils.parseACME(nodeconfig.acme);

                let find_free_slot = () => {
                    for (let i = 0; i < Proxmox.Utils.acmedomain_count; i++) {
                        if (nodeconfig[`acmedomain${i}`] === undefined) {
                            return `acmedomain${i}`;
                        }
                    }
                    throw 'too many domains configured';
                };

                // If we have a 'usage' property (pmg), we only use the `acmedomainX` config keys.
                if (win.separateDomainEntries || win.domainUsages) {
                    if (!configkey || configkey === 'acme') {
                        configkey = find_free_slot();
                    }
                    delete values.type;
                    params[configkey] = Proxmox.Utils.printPropertyString(values, 'domain');
                    return params;
                }

                // Otherwise we put the standalone entries into the `domains` list of the `acme`
                // property string.

                // Then insert the domain depending on its type:
                if (values.type === 'dns') {
                    if (!olddomain.configkey || olddomain.configkey === 'acme') {
                        configkey = find_free_slot();
                        if (olddomain.domain) {
                            // we have to remove the domain from the acme domainlist
                            Proxmox.Utils.remove_domain_from_acme(acmeObj, olddomain.domain);
                            params.acme = Proxmox.Utils.printACME(acmeObj);
                        }
                    }

                    delete values.type;
                    params[configkey] = Proxmox.Utils.printPropertyString(values, 'domain');
                } else {
                    if (olddomain.configkey && olddomain.configkey !== 'acme') {
                        // delete the old dns entry, unless we need to declare its usage:
                        params.delete = [olddomain.configkey];
                    }

                    // add new, remove old and make entries unique
                    Proxmox.Utils.add_domain_to_acme(acmeObj, values.domain);
                    if (olddomain.domain !== values.domain) {
                        Proxmox.Utils.remove_domain_from_acme(acmeObj, olddomain.domain);
                    }
                    params.acme = Proxmox.Utils.printACME(acmeObj);
                }

                return params;
            },
            items: [
                {
                    xtype: 'proxmoxKVComboBox',
                    name: 'type',
                    fieldLabel: gettext('Challenge Type'),
                    allowBlank: false,
                    value: 'standalone',
                    comboItems: [
                        ['standalone', 'HTTP'],
                        ['dns', 'DNS'],
                    ],
                    validator: function (value) {
                        let me = this;
                        let win = me.up('pmxACMEDomainEdit');
                        let oldconfigkey = win.domain ? win.domain.configkey : undefined;
                        let val = me.getValue();
                        if (val === 'dns' && (!oldconfigkey || oldconfigkey === 'acme')) {
                            // we have to check if there is a 'acmedomain' slot left
                            let found = false;
                            for (let i = 0; i < Proxmox.Utils.acmedomain_count; i++) {
                                if (!win.nodeconfig[`acmedomain${i}`]) {
                                    found = true;
                                }
                            }
                            if (!found) {
                                return gettext('Only 5 Domains with type DNS can be configured');
                            }
                        }

                        return true;
                    },
                    listeners: {
                        change: function (cb, value) {
                            let me = this;
                            let view = me.up('pmxACMEDomainEdit');
                            let pluginField = view.down('field[name=plugin]');
                            pluginField.setDisabled(value !== 'dns');
                            pluginField.setHidden(value !== 'dns');
                        },
                    },
                },
                {
                    xtype: 'hidden',
                    name: 'alias',
                },
                {
                    xtype: 'pmxACMEPluginSelector',
                    name: 'plugin',
                    disabled: true,
                    hidden: true,
                    allowBlank: false,
                    cbind: {
                        url: '{pluginsUrl}',
                    },
                },
                {
                    xtype: 'proxmoxtextfield',
                    name: 'domain',
                    allowBlank: false,
                    vtype: 'DnsNameOrWildcard',
                    value: '',
                    fieldLabel: gettext('Domain'),
                },
                {
                    xtype: 'combobox',
                    name: 'usage',
                    multiSelect: true,
                    editable: false,
                    fieldLabel: gettext('Usage'),
                    cbind: {
                        hidden: '{!hasUsage}',
                        allowBlank: '{!hasUsage}',
                    },
                    fields: ['usage', 'name'],
                    displayField: 'name',
                    valueField: 'usage',
                    store: {
                        data: [
                            { usage: 'api', name: 'API' },
                            { usage: 'smtp', name: 'SMTP' },
                        ],
                    },
                },
            ],
        },
    ],

    initComponent: function () {
        let me = this;

        if (!me.url) {
            throw 'no url given';
        }

        if (!me.acmeUrl) {
            throw 'no acmeUrl given';
        }

        if (!me.nodeconfig) {
            throw 'no nodeconfig given';
        }

        me.isCreate = !me.domain;
        if (me.isCreate) {
            me.domain = `${Proxmox.NodeName}.`; // TODO: FQDN of node
        }

        me.callParent();

        if (!me.isCreate) {
            let values = { ...me.domain };
            if (Ext.isDefined(values.usage)) {
                values.usage = values.usage.split(';');
            }
            me.setValues(values);
        } else {
            me.setValues({ domain: me.domain });
        }
    },
});
Ext.define('Proxmox.window.EndpointEditBase', {
    extend: 'Proxmox.window.Edit',

    isAdd: true,

    fieldDefaults: {
        labelWidth: 120,
    },

    width: 700,

    initComponent: function () {
        let me = this;

        me.isCreate = !me.name;

        if (!me.baseUrl) {
            throw 'baseUrl not set';
        }

        if (me.type === 'group') {
            me.url = `/api2/extjs${me.baseUrl}/groups`;
        } else {
            me.url = `/api2/extjs${me.baseUrl}/endpoints/${me.type}`;
        }

        if (me.isCreate) {
            me.method = 'POST';
        } else {
            me.url += `/${me.name}`;
            me.method = 'PUT';
        }

        let endpointConfig = Proxmox.Schema.notificationEndpointTypes[me.type];
        if (!endpointConfig) {
            throw 'unknown endpoint type';
        }

        me.subject = endpointConfig.name;

        Ext.apply(me, {
            items: [
                {
                    name: me.name,
                    xtype: endpointConfig.ipanel,
                    isCreate: me.isCreate,
                    baseUrl: me.baseUrl,
                    type: me.type,
                    defaultMailAuthor: endpointConfig.defaultMailAuthor,
                },
            ],
        });

        me.callParent();

        if (!me.isCreate) {
            me.load();
        }
    },
});
Ext.define('Proxmox.panel.NotificationMatcherGeneralPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxNotificationMatcherGeneralPanel',
    mixins: ['Proxmox.Mixin.CBind'],

    items: [
        {
            xtype: 'pmxDisplayEditField',
            name: 'name',
            cbind: {
                value: '{name}',
                editable: '{isCreate}',
            },
            fieldLabel: gettext('Matcher Name'),
            allowBlank: false,
        },
        {
            xtype: 'proxmoxcheckbox',
            name: 'enable',
            fieldLabel: gettext('Enable'),
            allowBlank: false,
            checked: true,
        },
        {
            xtype: 'proxmoxtextfield',
            name: 'comment',
            fieldLabel: gettext('Comment'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],

    onSetValues: function (values) {
        values.enable = !values.disable;

        delete values.disable;
        return values;
    },

    onGetValues: function (values) {
        let me = this;

        if (values.enable) {
            if (!me.isCreate) {
                Proxmox.Utils.assemble_field_data(values, { delete: 'disable' });
            }
        } else {
            values.disable = 1;
        }
        delete values.enable;

        return values;
    },
});

Ext.define('Proxmox.panel.NotificationMatcherTargetPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxNotificationMatcherTargetPanel',
    mixins: ['Proxmox.Mixin.CBind'],

    items: [
        {
            xtype: 'pmxNotificationTargetSelector',
            name: 'target',
            allowBlank: false,
        },
    ],
});

Ext.define('Proxmox.window.NotificationMatcherEdit', {
    extend: 'Proxmox.window.Edit',

    isAdd: true,
    onlineHelp: 'notification_matchers',

    fieldDefaults: {
        labelWidth: 120,
    },

    width: 800,

    initComponent: function () {
        let me = this;

        me.isCreate = !me.name;

        if (!me.baseUrl) {
            throw 'baseUrl not set';
        }

        me.url = `/api2/extjs${me.baseUrl}/matchers`;

        if (me.isCreate) {
            me.method = 'POST';
        } else {
            me.url += `/${me.name}`;
            me.method = 'PUT';
        }

        me.subject = gettext('Notification Matcher');

        Ext.apply(me, {
            bodyPadding: 0,
            items: [
                {
                    xtype: 'tabpanel',
                    region: 'center',
                    layout: 'fit',
                    bodyPadding: 10,
                    items: [
                        {
                            name: me.name,
                            title: gettext('General'),
                            xtype: 'pmxNotificationMatcherGeneralPanel',
                            isCreate: me.isCreate,
                            baseUrl: me.baseUrl,
                        },
                        {
                            name: me.name,
                            title: gettext('Match Rules'),
                            xtype: 'pmxNotificationMatchRulesEditPanel',
                            isCreate: me.isCreate,
                            baseUrl: me.baseUrl,
                        },
                        {
                            name: me.name,
                            title: gettext('Targets to notify'),
                            xtype: 'pmxNotificationMatcherTargetPanel',
                            isCreate: me.isCreate,
                            baseUrl: me.baseUrl,
                        },
                    ],
                },
            ],
        });

        me.callParent();

        if (!me.isCreate) {
            me.load();
        }
    },
});

Ext.define('Proxmox.form.NotificationTargetSelector', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.pmxNotificationTargetSelector',

    mixins: {
        field: 'Ext.form.field.Field',
    },

    padding: '0 0 10 0',

    allowBlank: true,
    selectAll: false,
    isFormField: true,

    store: {
        autoLoad: true,
        model: 'proxmox-notification-endpoints',
        sorters: 'name',
    },

    columns: [
        {
            header: gettext('Target Name'),
            dataIndex: 'name',
            flex: 1,
        },
        {
            header: gettext('Type'),
            dataIndex: 'type',
            flex: 1,
        },
        {
            header: gettext('Comment'),
            dataIndex: 'comment',
            flex: 3,
        },
    ],

    selModel: {
        selType: 'checkboxmodel',
        mode: 'SIMPLE',
    },

    checkChangeEvents: ['selectionchange', 'change'],

    listeners: {
        selectionchange: function () {
            // to trigger validity and error checks
            this.checkChange();
        },
    },

    getSubmitData: function () {
        let me = this;
        let res = {};
        res[me.name] = me.getValue();
        return res;
    },

    getValue: function () {
        let me = this;
        if (me.savedValue !== undefined) {
            return me.savedValue;
        }
        let sm = me.getSelectionModel();
        return (sm.getSelection() ?? []).map((item) => item.data.name);
    },

    setValueSelection: function (value) {
        let me = this;

        let store = me.getStore();

        let notFound = [];
        let selection = value
            .map((item) => {
                let found = store.findRecord('name', item, 0, false, true, true);
                if (!found) {
                    notFound.push(item);
                }
                return found;
            })
            .filter((r) => r);

        for (const name of notFound) {
            let rec = store.add({
                name,
                type: '-',
                comment: gettext('Included target does not exist!'),
            });
            selection.push(rec[0]);
        }

        let sm = me.getSelectionModel();
        if (selection.length) {
            sm.select(selection);
        } else {
            sm.deselectAll();
        }
        // to correctly trigger invalid class
        me.getErrors();
    },

    setValue: function (value) {
        let me = this;

        let store = me.getStore();
        if (!store.isLoaded()) {
            me.savedValue = value;
            store.on(
                'load',
                function () {
                    me.setValueSelection(value);
                    delete me.savedValue;
                },
                { single: true },
            );
        } else {
            me.setValueSelection(value);
        }
        return me.mixins.field.setValue.call(me, value);
    },

    getErrors: function (value) {
        let me = this;
        if (
            !me.isDisabled() &&
            me.allowBlank === false &&
            me.getSelectionModel().getCount() === 0
        ) {
            me.addBodyCls(['x-form-trigger-wrap-default', 'x-form-trigger-wrap-invalid']);
            return [gettext('No target selected')];
        }

        me.removeBodyCls(['x-form-trigger-wrap-default', 'x-form-trigger-wrap-invalid']);
        return [];
    },

    initComponent: function () {
        let me = this;
        me.callParent();
        me.initField();
    },
});

Ext.define('Proxmox.panel.NotificationRulesEditPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxNotificationMatchRulesEditPanel',
    mixins: ['Proxmox.Mixin.CBind'],

    controller: {
        xclass: 'Ext.app.ViewController',

        // we want to also set the empty value, but 'bind' does not do that so
        // we have to set it then (and only then) to get the correct value in
        // the tree
        control: {
            field: {
                change: function (cmp) {
                    let me = this;
                    let vm = me.getViewModel();
                    if (cmp.field) {
                        let record = vm.get('selectedRecord');
                        if (!record) {
                            return;
                        }
                        let data = Ext.apply({}, record.get('data'));
                        let value = cmp.getValue();
                        // only update if the value is empty (or empty array)
                        if (!value || !value.length) {
                            data[cmp.field] = value;
                            record.set({ data });
                        }
                    }
                },
            },
        },
    },

    viewModel: {
        data: {
            selectedRecord: null,
            matchFieldType: 'exact',
            matchFieldField: '',
            matchFieldValue: '',
            rootMode: 'all',
        },

        formulas: {
            nodeType: {
                get: function (get) {
                    let record = get('selectedRecord');
                    return record?.get('type');
                },
                set: function (value) {
                    let me = this;
                    let record = me.get('selectedRecord');

                    let data;

                    switch (value) {
                        case 'match-severity':
                            data = {
                                value: ['info', 'notice', 'warning', 'error', 'unknown'],
                            };
                            break;
                        case 'match-field':
                            data = {
                                type: 'exact',
                                field: '',
                                value: '',
                            };
                            break;
                        case 'match-calendar':
                            data = {
                                value: '',
                            };
                            break;
                    }

                    let node = {
                        type: value,
                        data,
                    };
                    record.set(node);
                },
            },
            showMatchingMode: function (get) {
                let record = get('selectedRecord');
                if (!record) {
                    return false;
                }
                return record.isRoot();
            },
            showMatcherType: function (get) {
                let record = get('selectedRecord');
                if (!record) {
                    return false;
                }
                return !record.isRoot();
            },

            rootMode: {
                bind: {
                    bindTo: '{selectedRecord}',
                    deep: true,
                },
                set: function (value) {
                    let me = this;
                    let record = me.get('selectedRecord');
                    let currentData = record.get('data');
                    let invert = false;
                    if (value.startsWith('not')) {
                        value = value.substring(3);
                        invert = true;
                    }
                    record.set({
                        data: {
                            ...currentData,
                            value,
                            invert,
                        },
                    });
                },
                get: function (record) {
                    let prefix = record?.get('data').invert ? 'not' : '';
                    return prefix + record?.get('data')?.value;
                },
            },
        },
    },

    column1: [
        {
            xtype: 'pmxNotificationMatchRuleTree',
            cbind: {
                isCreate: '{isCreate}',
            },
        },
    ],
    column2: [
        {
            xtype: 'pmxNotificationMatchRuleSettings',
            cbind: {
                baseUrl: '{baseUrl}',
            },
        },
    ],

    onGetValues: function (values) {
        let me = this;

        let deleteArrayIfEmtpy = (field) => {
            if (Ext.isArray(values[field])) {
                if (values[field].length === 0) {
                    delete values[field];
                    if (!me.isCreate) {
                        Proxmox.Utils.assemble_field_data(values, { delete: field });
                    }
                }
            }
        };
        deleteArrayIfEmtpy('match-field');
        deleteArrayIfEmtpy('match-severity');
        deleteArrayIfEmtpy('match-calendar');

        return values;
    },
});

Ext.define('Proxmox.panel.NotificationMatchRuleTree', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmxNotificationMatchRuleTree',
    mixins: ['Proxmox.Mixin.CBind'],
    border: false,

    getNodeTextAndIcon: function (type, data) {
        let text;
        let iconCls;

        switch (type) {
            case 'match-severity':
                {
                    let v = data.value;
                    if (Ext.isArray(data.value)) {
                        v = data.value.join(', ');
                    }
                    text = Ext.String.format(gettext('Match severity: {0}'), v);
                    iconCls = 'fa fa-exclamation';
                    if (!v) {
                        iconCls += ' internal-error';
                    }
                }
                break;
            case 'match-field':
                {
                    let field = data.field;
                    let value = data.value;
                    text = Ext.String.format(gettext('Match field: {0}={1}'), field, value);
                    iconCls = 'fa fa-square-o';
                    if (!field || !value || (Ext.isArray(value) && !value.length)) {
                        iconCls += ' internal-error';
                    }
                }
                break;
            case 'match-calendar':
                {
                    let v = data.value;
                    text = Ext.String.format(gettext('Match calendar: {0}'), v);
                    iconCls = 'fa fa-calendar-o';
                    if (!v || !v.length) {
                        iconCls += ' internal-error';
                    }
                }
                break;
            case 'mode':
                if (data.value === 'all') {
                    if (data.invert) {
                        text = gettext('At least one rule does not match');
                    } else {
                        text = gettext('All rules match');
                    }
                } else if (data.value === 'any') {
                    if (data.invert) {
                        text = gettext('No rule matches');
                    } else {
                        text = gettext('Any rule matches');
                    }
                }
                iconCls = 'fa fa-filter';

                break;
        }

        return [text, iconCls];
    },

    initComponent: function () {
        let me = this;

        let treeStore = Ext.create('Ext.data.TreeStore', {
            root: {
                expanded: true,
                expandable: false,
                text: '',
                type: 'mode',
                data: {
                    value: 'all',
                    invert: false,
                },
                children: [],
                iconCls: 'fa fa-filter',
            },
        });

        let realMatchFields = Ext.create({
            xtype: 'hiddenfield',
            setValue: function (value) {
                this.value = value;
                this.checkChange();
            },
            getValue: function () {
                return this.value;
            },
            getErrors: function () {
                for (const matcher of this.value ?? []) {
                    let matches = matcher.match(/^([^:]+):([^=]+)=(.+)$/);
                    if (!matches) {
                        return ['']; // fake error for validation
                    }
                }
                return [];
            },
            getSubmitValue: function () {
                let value = this.value;
                if (!value) {
                    value = [];
                }
                return value;
            },
            name: 'match-field',
        });

        let realMatchSeverity = Ext.create({
            xtype: 'hiddenfield',
            setValue: function (value) {
                this.value = value;
                this.checkChange();
            },
            getValue: function () {
                return this.value;
            },
            getErrors: function () {
                for (const severities of this.value ?? []) {
                    if (!severities) {
                        return ['']; // fake error for validation
                    }
                }
                return [];
            },
            getSubmitValue: function () {
                let value = this.value;
                if (!value) {
                    value = [];
                }
                return value;
            },
            name: 'match-severity',
        });

        let realMode = Ext.create({
            xtype: 'hiddenfield',
            name: 'mode',
            setValue: function (value) {
                this.value = value;
                this.checkChange();
            },
            getValue: function () {
                return this.value;
            },
            getSubmitValue: function () {
                let value = this.value;
                return value;
            },
        });

        let realMatchCalendar = Ext.create({
            xtype: 'hiddenfield',
            name: 'match-calendar',

            setValue: function (value) {
                this.value = value;
                this.checkChange();
            },
            getValue: function () {
                return this.value;
            },
            getErrors: function () {
                for (const timespan of this.value ?? []) {
                    if (!timespan) {
                        return ['']; // fake error for validation
                    }
                }
                return [];
            },
            getSubmitValue: function () {
                let value = this.value;
                return value;
            },
        });

        let realInvertMatch = Ext.create({
            xtype: 'proxmoxcheckbox',
            name: 'invert-match',
            hidden: true,
            deleteEmpty: !me.isCreate,
        });

        let storeChanged = function (store) {
            store.suspendEvent('datachanged');

            let matchFieldStmts = [];
            let matchSeverityStmts = [];
            let matchCalendarStmts = [];
            let modeStmt = 'all';
            let invertMatchStmt = false;

            store.each(function (model) {
                let type = model.get('type');
                let data = model.get('data');

                switch (type) {
                    case 'match-field':
                        matchFieldStmts.push(
                            `${data.type}:${data.field ?? ''}=${data.value ?? ''}`,
                        );
                        break;
                    case 'match-severity':
                        if (Ext.isArray(data.value)) {
                            matchSeverityStmts.push(data.value.join(','));
                        } else {
                            matchSeverityStmts.push(data.value);
                        }
                        break;
                    case 'match-calendar':
                        matchCalendarStmts.push(data.value);
                        break;
                    case 'mode':
                        modeStmt = data.value;
                        invertMatchStmt = data.invert;
                        break;
                }

                let [text, iconCls] = me.getNodeTextAndIcon(type, data);
                model.set({
                    text,
                    iconCls,
                });
            });

            realMatchFields.suspendEvent('change');
            realMatchFields.setValue(matchFieldStmts);
            realMatchFields.resumeEvent('change');

            realMatchCalendar.suspendEvent('change');
            realMatchCalendar.setValue(matchCalendarStmts);
            realMatchCalendar.resumeEvent('change');

            realMode.suspendEvent('change');
            realMode.setValue(modeStmt);
            realMode.resumeEvent('change');

            realInvertMatch.suspendEvent('change');
            realInvertMatch.setValue(invertMatchStmt);
            realInvertMatch.resumeEvent('change');

            realMatchSeverity.suspendEvent('change');
            realMatchSeverity.setValue(matchSeverityStmts);
            realMatchSeverity.resumeEvent('change');

            store.resumeEvent('datachanged');
        };

        realMatchFields.addListener('change', function (field, value) {
            let parseMatchField = function (filter) {
                let [, type, matchedField, matchedValue] = filter.match(
                    /^(?:(regex|exact):)?([A-Za-z0-9_][A-Za-z0-9._-]*)=(.+)$/,
                );
                if (type === undefined) {
                    type = 'exact';
                }

                if (type === 'exact') {
                    matchedValue = matchedValue.split(',');
                }

                return {
                    type: 'match-field',
                    data: {
                        type,
                        field: matchedField,
                        value: matchedValue,
                    },
                    leaf: true,
                };
            };

            for (let node of treeStore
                .queryBy((record) => record.get('type') === 'match-field')
                .getRange()) {
                node.remove(true);
            }

            if (!value) {
                return;
            }
            let records = value.map(parseMatchField);

            let rootNode = treeStore.getRootNode();

            for (let record of records) {
                rootNode.appendChild(record);
            }
        });

        realMatchSeverity.addListener('change', function (field, value) {
            let parseSeverity = function (severities) {
                return {
                    type: 'match-severity',
                    data: {
                        value: severities.split(','),
                    },
                    leaf: true,
                };
            };

            for (let node of treeStore
                .queryBy((record) => record.get('type') === 'match-severity')
                .getRange()) {
                node.remove(true);
            }

            let records = value.map(parseSeverity);
            let rootNode = treeStore.getRootNode();

            for (let record of records) {
                rootNode.appendChild(record);
            }
        });

        realMatchCalendar.addListener('change', function (field, value) {
            let parseCalendar = function (timespan) {
                return {
                    type: 'match-calendar',
                    data: {
                        value: timespan,
                    },
                    leaf: true,
                };
            };

            for (let node of treeStore
                .queryBy((record) => record.get('type') === 'match-calendar')
                .getRange()) {
                node.remove(true);
            }

            let records = value.map(parseCalendar);
            let rootNode = treeStore.getRootNode();

            for (let record of records) {
                rootNode.appendChild(record);
            }
        });

        realMode.addListener('change', function (field, value) {
            let data = treeStore.getRootNode().get('data');
            treeStore.getRootNode().set('data', {
                ...data,
                value,
            });
        });

        realInvertMatch.addListener('change', function (field, value) {
            let data = treeStore.getRootNode().get('data');
            treeStore.getRootNode().set('data', {
                ...data,
                invert: value,
            });
        });

        treeStore.addListener('datachanged', storeChanged);

        let treePanel = Ext.create({
            xtype: 'treepanel',
            store: treeStore,
            minHeight: 300,
            maxHeight: 300,
            scrollable: true,

            bind: {
                selection: '{selectedRecord}',
            },
        });

        let addNode = function () {
            let node = {
                type: 'match-field',
                data: {
                    type: 'exact',
                    field: '',
                    value: '',
                },
                leaf: true,
            };
            treeStore.getRootNode().appendChild(node);
            treePanel.setSelection(treeStore.getRootNode().lastChild);
        };

        let deleteNode = function () {
            let selection = treePanel.getSelection();
            for (let selected of selection) {
                if (!selected.isRoot()) {
                    selected.remove(true);
                }
            }
        };

        Ext.apply(me, {
            items: [
                realMatchFields,
                realMode,
                realMatchSeverity,
                realInvertMatch,
                realMatchCalendar,
                treePanel,
                {
                    xtype: 'button',
                    margin: '5 5 5 0',
                    text: gettext('Add'),
                    iconCls: 'fa fa-plus-circle',
                    handler: addNode,
                },
                {
                    xtype: 'button',
                    margin: '5 5 5 0',
                    text: gettext('Remove'),
                    iconCls: 'fa fa-minus-circle',
                    handler: deleteNode,
                },
            ],
        });
        me.callParent();
    },
});

Ext.define('Proxmox.panel.NotificationMatchRuleSettings', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmxNotificationMatchRuleSettings',
    mixins: ['Proxmox.Mixin.CBind'],
    border: false,
    layout: 'anchor',

    items: [
        {
            xtype: 'proxmoxKVComboBox',
            name: 'mode',
            fieldLabel: gettext('Match if'),
            allowBlank: false,
            isFormField: false,

            matchFieldWidth: false,

            comboItems: [
                ['all', gettext('All rules match')],
                ['any', gettext('Any rule matches')],
                ['notall', gettext('At least one rule does not match')],
                ['notany', gettext('No rule matches')],
            ],
            // Hide initially to avoid glitches when opening the window
            hidden: true,
            bind: {
                hidden: '{!showMatchingMode}',
                disabled: '{!showMatchingMode}',
                value: '{rootMode}',
            },
        },
        {
            xtype: 'proxmoxKVComboBox',
            fieldLabel: gettext('Node type'),
            isFormField: false,
            allowBlank: false,
            // Hide initially to avoid glitches when opening the window
            hidden: true,
            bind: {
                value: '{nodeType}',
                hidden: '{!showMatcherType}',
                disabled: '{!showMatcherType}',
            },

            comboItems: [
                ['match-field', gettext('Match Field')],
                ['match-severity', gettext('Match Severity')],
                ['match-calendar', gettext('Match Calendar')],
            ],
        },
        {
            xtype: 'pmxNotificationMatchFieldSettings',
            cbind: {
                baseUrl: '{baseUrl}',
            },
        },
        {
            xtype: 'pmxNotificationMatchSeveritySettings',
        },
        {
            xtype: 'pmxNotificationMatchCalendarSettings',
        },
    ],
});

Ext.define('Proxmox.panel.MatchCalendarSettings', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmxNotificationMatchCalendarSettings',
    border: false,
    layout: 'anchor',
    // Hide initially to avoid glitches when opening the window
    hidden: true,
    bind: {
        hidden: '{!typeIsMatchCalendar}',
    },
    viewModel: {
        // parent is set in `initComponents`
        formulas: {
            typeIsMatchCalendar: {
                bind: {
                    bindTo: '{selectedRecord}',
                    deep: true,
                },
                get: function (record) {
                    return record?.get('type') === 'match-calendar';
                },
            },

            matchCalendarValue: {
                bind: {
                    bindTo: '{selectedRecord}',
                    deep: true,
                },
                set: function (value) {
                    let me = this;
                    let record = me.get('selectedRecord');
                    let currentData = record.get('data');
                    record.set({
                        data: {
                            ...currentData,
                            value: value,
                        },
                    });
                },
                get: function (record) {
                    return record?.get('data')?.value;
                },
            },
        },
    },
    items: [
        {
            xtype: 'proxmoxKVComboBox',
            fieldLabel: gettext('Timespan to match'),
            isFormField: false,
            allowBlank: false,
            editable: true,
            displayField: 'key',
            field: 'value',
            bind: {
                value: '{matchCalendarValue}',
                disabled: '{!typeIsMatchCalender}',
            },

            comboItems: [
                ['mon 8-12', ''],
                ['tue..fri,sun 0:00-23:59', ''],
            ],
        },
    ],

    initComponent: function () {
        let me = this;
        Ext.apply(me.viewModel, {
            parent: me.up('pmxNotificationMatchRulesEditPanel').getViewModel(),
        });
        me.callParent();
    },
});

Ext.define('Proxmox.panel.MatchSeveritySettings', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmxNotificationMatchSeveritySettings',
    border: false,
    layout: 'anchor',
    // Hide initially to avoid glitches when opening the window
    hidden: true,
    bind: {
        hidden: '{!typeIsMatchSeverity}',
    },
    viewModel: {
        // parent is set in `initComponents`
        formulas: {
            typeIsMatchSeverity: {
                bind: {
                    bindTo: '{selectedRecord}',
                    deep: true,
                },
                get: function (record) {
                    return record?.get('type') === 'match-severity';
                },
            },
            matchSeverityValue: {
                bind: {
                    bindTo: '{selectedRecord}',
                    deep: true,
                },
                set: function (value) {
                    let record = this.get('selectedRecord');
                    let currentData = record.get('data');
                    record.set({
                        data: {
                            ...currentData,
                            value: value,
                        },
                    });
                },
                get: function (record) {
                    return record?.get('data')?.value;
                },
            },
        },
    },
    items: [
        {
            xtype: 'proxmoxKVComboBox',
            fieldLabel: gettext('Severities to match'),
            isFormField: false,
            allowBlank: true,
            multiSelect: true,
            field: 'value',
            // Hide initially to avoid glitches when opening the window
            hidden: true,
            bind: {
                value: '{matchSeverityValue}',
                hidden: '{!typeIsMatchSeverity}',
                disabled: '{!typeIsMatchSeverity}',
            },

            comboItems: [
                ['info', gettext('Info')],
                ['notice', gettext('Notice')],
                ['warning', ngettext('Warning', 'Warnings', 1)],
                ['error', gettext('Error')],
                ['unknown', gettext('Unknown')],
            ],
        },
    ],

    initComponent: function () {
        let me = this;
        Ext.apply(me.viewModel, {
            parent: me.up('pmxNotificationMatchRulesEditPanel').getViewModel(),
        });
        me.callParent();
    },
});

Ext.define('Proxmox.panel.MatchFieldSettings', {
    extend: 'Ext.panel.Panel',
    xtype: 'pmxNotificationMatchFieldSettings',
    border: false,
    layout: 'anchor',
    // Hide initially to avoid glitches when opening the window
    hidden: true,
    bind: {
        hidden: '{!typeIsMatchField}',
    },
    controller: {
        xclass: 'Ext.app.ViewController',

        control: {
            'field[reference=fieldSelector]': {
                change: function (field) {
                    let view = this.getView();
                    let valueField = view.down('field[reference=valueSelector]');
                    let store = valueField.getStore();
                    let val = field.getValue();

                    if (val) {
                        store.setFilters([
                            {
                                property: 'field',
                                value: val,
                            },
                        ]);
                    }
                },
            },
        },
    },
    viewModel: {
        // parent is set in `initComponents`
        formulas: {
            typeIsMatchField: {
                bind: {
                    bindTo: '{selectedRecord}',
                    deep: true,
                },
                get: function (record) {
                    return record?.get('type') === 'match-field';
                },
            },
            isRegex: function (get) {
                return get('matchFieldType') === 'regex';
            },
            matchFieldType: {
                bind: {
                    bindTo: '{selectedRecord}',
                    deep: true,
                },
                set: function (value) {
                    let record = this.get('selectedRecord');
                    let currentData = record.get('data');

                    let newValue = [];

                    // Build equivalent regular expression if switching
                    // to 'regex' mode
                    if (value === 'regex') {
                        let regexVal = '^';
                        if (currentData.value && currentData.value.length) {
                            regexVal += `(${currentData.value.join('|')})`;
                        }
                        regexVal += '$';
                        newValue.push(regexVal);
                    }

                    record.set({
                        data: {
                            ...currentData,
                            type: value,
                            value: newValue,
                        },
                    });
                },
                get: function (record) {
                    return record?.get('data')?.type;
                },
            },
            matchFieldField: {
                bind: {
                    bindTo: '{selectedRecord}',
                    deep: true,
                },
                set: function (value) {
                    let record = this.get('selectedRecord');
                    let currentData = record.get('data');

                    record.set({
                        data: {
                            ...currentData,
                            field: value,
                            // Reset value if field changes
                            value: [],
                        },
                    });
                },
                get: function (record) {
                    return record?.get('data')?.field;
                },
            },
            matchFieldValue: {
                bind: {
                    bindTo: '{selectedRecord}',
                    deep: true,
                },
                set: function (value) {
                    let record = this.get('selectedRecord');
                    let currentData = record.get('data');
                    record.set({
                        data: {
                            ...currentData,
                            value: value,
                        },
                    });
                },
                get: function (record) {
                    return record?.get('data')?.value;
                },
            },
        },
    },

    initComponent: function () {
        let me = this;

        let store = Ext.create('Ext.data.Store', {
            model: 'proxmox-notification-fields',
            autoLoad: true,
            proxy: {
                type: 'proxmox',
                url: `/api2/json/${me.baseUrl}/matcher-fields`,
            },
            listeners: {
                load: function () {
                    this.each(function (record) {
                        record.set({
                            description: Proxmox.Utils.formatNotificationFieldName(
                                record.get('name'),
                            ),
                        });
                    });

                    // Commit changes so that the description field is not marked
                    // as dirty
                    this.commitChanges();
                },
            },
        });

        let valueStore = Ext.create('Ext.data.Store', {
            model: 'proxmox-notification-field-values',
            autoLoad: true,
            proxy: {
                type: 'proxmox',

                url: `/api2/json/${me.baseUrl}/matcher-field-values`,
            },
            listeners: {
                load: function () {
                    this.each(
                        function (record) {
                            if (record.get('field') === 'type') {
                                record.set({
                                    comment: Proxmox.Utils.formatNotificationFieldValue(
                                        record.get('value'),
                                    ),
                                });
                            }
                        },
                        this,
                        true,
                    );

                    // Commit changes so that the description field is not marked
                    // as dirty
                    this.commitChanges();
                },
            },
        });

        Ext.apply(me.viewModel, {
            parent: me.up('pmxNotificationMatchRulesEditPanel').getViewModel(),
        });
        Ext.apply(me, {
            items: [
                {
                    fieldLabel: gettext('Match Type'),
                    xtype: 'proxmoxKVComboBox',
                    reference: 'type',
                    isFormField: false,
                    allowBlank: false,
                    submitValue: false,
                    field: 'type',

                    bind: {
                        value: '{matchFieldType}',
                    },

                    comboItems: [
                        ['exact', gettext('Exact')],
                        ['regex', gettext('Regex')],
                    ],
                },
                {
                    fieldLabel: gettext('Field'),
                    reference: 'fieldSelector',
                    xtype: 'proxmoxComboGrid',
                    isFormField: false,
                    submitValue: false,
                    allowBlank: false,
                    editable: false,
                    store: store,
                    queryMode: 'local',
                    valueField: 'name',
                    displayField: 'description',
                    field: 'field',
                    bind: {
                        value: '{matchFieldField}',
                    },
                    listConfig: {
                        columns: [
                            {
                                header: gettext('Description'),
                                dataIndex: 'description',
                                flex: 2,
                            },
                            {
                                header: gettext('Field Name'),
                                dataIndex: 'name',
                                flex: 1,
                            },
                        ],
                    },
                },
                {
                    fieldLabel: gettext('Value'),
                    reference: 'valueSelector',
                    xtype: 'proxmoxComboGrid',
                    autoSelect: false,
                    editable: false,
                    isFormField: false,
                    submitValue: false,
                    allowBlank: false,
                    showClearTrigger: true,
                    field: 'value',
                    store: valueStore,
                    valueField: 'value',
                    displayField: 'value',
                    notFoundIsValid: false,
                    multiSelect: true,
                    bind: {
                        value: '{matchFieldValue}',
                        hidden: '{isRegex}',
                    },
                    listConfig: {
                        columns: [
                            {
                                header: gettext('Value'),
                                dataIndex: 'value',
                                flex: 1,
                            },
                            {
                                header: gettext('Comment'),
                                dataIndex: 'comment',
                                flex: 2,
                            },
                        ],
                    },
                },
                {
                    fieldLabel: gettext('Regex'),
                    xtype: 'proxmoxtextfield',
                    editable: true,
                    isFormField: false,
                    submitValue: false,
                    allowBlank: false,
                    field: 'value',
                    bind: {
                        value: '{matchFieldValue}',
                        hidden: '{!isRegex}',
                    },
                },
            ],
        });
        me.callParent();
    },
});
Ext.define('proxmox-file-tree', {
    extend: 'Ext.data.Model',

    fields: [
        'filepath',
        'text',
        'type',
        'size',
        {
            name: 'sizedisplay',
            calculate: (data) => {
                if (data.size === undefined) {
                    return '';
                    // biome-ignore lint/correctness/noConstantCondition: temporarily disabled
                } else if (false && data.type === 'd') {
                    // FIXME: enable again once we fixed trouble with confusing size vs item #
                    let fs = data.size === 1 ? gettext('{0} Item') : gettext('{0} Items');
                    return Ext.String.format(fs, data.size);
                }

                return Proxmox.Utils.format_size(data.size);
            },
        },
        {
            name: 'mtime',
            type: 'date',
            dateFormat: 'timestamp',
        },
        {
            name: 'iconCls',
            calculate: function (data) {
                let icon = Proxmox.Schema.pxarFileTypes[data.type]?.icon ?? 'file-o';
                if (data.expanded && data.type === 'd') {
                    icon = 'folder-open-o';
                }
                return `fa fa-${icon}`;
            },
        },
    ],
    idProperty: 'filepath',
});

Ext.define('Proxmox.window.FileBrowser', {
    extend: 'Ext.window.Window',

    width: 800,
    height: 600,

    modal: true,

    config: {
        // the base-URL to get the list of files. required.
        listURL: '',

        // the base download URL, e.g., something like '/api2/...'
        downloadURL: '',

        // extra parameters set as proxy paramns and for an actual download request
        extraParams: {},

        // the file types for which the download button should be enabled
        downloadableFileTypes: {
            h: true, // hardlinks
            f: true, // "normal" files
            d: true, // directories
        },

        // prefix to prepend to downloaded file names
        downloadPrefix: '',
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        buildUrl: function (baseurl, params) {
            let url = new URL(baseurl, window.location.origin);
            for (const [key, value] of Object.entries(params)) {
                url.searchParams.append(key, value);
            }

            return url.href;
        },

        downloadTar: function () {
            this.downloadFile(true);
        },

        downloadZip: function () {
            this.downloadFile(false);
        },

        downloadFile: function (tar) {
            let me = this;
            let view = me.getView();
            let tree = me.lookup('tree');
            let selection = tree.getSelection();
            if (!selection || selection.length < 1) {
                return;
            }

            let data = selection[0].data;

            let params = { ...view.extraParams };
            params.filepath = data.filepath;

            let filename = view.downloadPrefix + data.text;
            if (data.type === 'd') {
                if (tar) {
                    params.tar = 1;
                    filename += '.tar.zst';
                } else {
                    filename += '.zip';
                }
            }

            Proxmox.Utils.downloadAsFile(me.buildUrl(view.downloadURL, params), filename);
        },

        fileChanged: function () {
            let me = this;
            let view = me.getView();
            let tree = me.lookup('tree');
            let selection = tree.getSelection();
            if (!selection || selection.length < 1) {
                return;
            }

            let data = selection[0].data;
            let st = Ext.String.format(gettext('Selected "{0}"'), atob(data.filepath));
            view.lookup('selectText').setText(st);

            let canDownload = view.downloadURL && view.downloadableFileTypes[data.type];
            let enableMenu = data.type === 'd';

            let downloadBtn = view.lookup('downloadBtn');
            downloadBtn.setDisabled(!canDownload || enableMenu);
            downloadBtn.setHidden(canDownload && enableMenu);
            let typeLabel =
                Proxmox.Schema.pxarFileTypes[data.type]?.label ?? Proxmox.Utils.unknownText;
            let ttip = Ext.String.format(
                gettext(
                    'File of type {0} cannot be downloaded directly, download a parent directory instead.',
                ),
                typeLabel,
            );
            if (!canDownload) {
                // ensure tooltip gets shown
                downloadBtn.setStyle({ pointerEvents: 'all' });
            }
            downloadBtn.setTooltip(canDownload ? null : ttip);

            let menuBtn = view.lookup('menuBtn');
            menuBtn.setDisabled(!canDownload || !enableMenu);
            menuBtn.setHidden(!canDownload || !enableMenu);
        },

        errorHandler: function (error, msg) {
            let me = this;
            if (error?.status === 503) {
                return false;
            }
            me.lookup('downloadBtn').setDisabled(true);
            me.lookup('menuBtn').setDisabled(true);
            if (me.initialLoadDone) {
                Ext.Msg.alert(gettext('Error'), msg);
                return true;
            }
            return false;
        },

        init: function (view) {
            let me = this;
            let tree = me.lookup('tree');

            if (!view.listURL) {
                throw 'no list URL given';
            }

            let store = tree.getStore();
            let proxy = store.getProxy();

            let errorCallback = (error, msg) => me.errorHandler(error, msg);
            proxy.setUrl(view.listURL);
            proxy.setTimeout(60 * 1000);
            proxy.setExtraParams(view.extraParams);

            tree.mon(store, 'beforeload', () => {
                Proxmox.Utils.setErrorMask(tree, true);
            });
            tree.mon(store, 'load', (treestore, rec, success, operation, node) => {
                if (success) {
                    Proxmox.Utils.setErrorMask(tree, false);
                    return;
                }
                if (!node.loadCount) {
                    node.loadCount = 0; // ensure its numeric
                }
                // trigger a reload if we got a 503 answer from the proxy
                if (operation?.error?.status === 503 && node.loadCount < 10) {
                    node.collapse();
                    node.expand();
                    node.loadCount++;
                    return;
                }

                let error = operation.getError();
                let msg = Proxmox.Utils.getResponseErrorMessage(error);
                if (!errorCallback(error, msg)) {
                    Proxmox.Utils.setErrorMask(tree, msg);
                } else {
                    Proxmox.Utils.setErrorMask(tree, false);
                }
            });
            store.load((rec, op, success) => {
                let root = store.getRoot();
                root.expand(); // always expand invisible root node
                if (view.archive === 'all') {
                    root.expandChildren(false);
                } else if (view.archive) {
                    let child = root.findChild('text', view.archive);
                    if (child) {
                        child.expand();
                        setTimeout(function () {
                            tree.setSelection(child);
                            tree.getView().focusRow(child);
                        }, 10);
                    }
                } else if (root.childNodes.length === 1) {
                    root.firstChild.expand();
                }
                me.initialLoadDone = success;
            });
        },

        control: {
            treepanel: {
                selectionchange: 'fileChanged',
            },
        },
    },

    layout: 'fit',
    items: [
        {
            xtype: 'treepanel',
            scrollable: true,
            rootVisible: false,
            reference: 'tree',
            store: {
                autoLoad: false,
                model: 'proxmox-file-tree',
                defaultRootId: '/',
                nodeParam: 'filepath',
                sorters: 'text',
                proxy: {
                    appendId: false,
                    type: 'proxmox',
                },
            },

            viewConfig: {
                loadMask: false,
            },

            columns: [
                {
                    text: gettext('Name'),
                    xtype: 'treecolumn',
                    flex: 1,
                    dataIndex: 'text',
                    renderer: Ext.String.htmlEncode,
                },
                {
                    text: gettext('Size'),
                    dataIndex: 'sizedisplay',
                    align: 'end',
                    sorter: {
                        sorterFn: function (a, b) {
                            if (a.data.type === 'd' && b.data.type !== 'd') {
                                return -1;
                            } else if (a.data.type !== 'd' && b.data.type === 'd') {
                                return 1;
                            }

                            let asize = a.data.size || 0;
                            let bsize = b.data.size || 0;

                            return asize - bsize;
                        },
                    },
                },
                {
                    text: gettext('Modified'),
                    dataIndex: 'mtime',
                    minWidth: 200,
                },
                {
                    text: gettext('Type'),
                    dataIndex: 'type',
                    renderer: (v) =>
                        Proxmox.Schema.pxarFileTypes[v]?.label ?? Proxmox.Utils.unknownText,
                },
            ],
        },
    ],

    fbar: [
        {
            text: '',
            xtype: 'label',
            reference: 'selectText',
        },
        {
            text: gettext('Download'),
            xtype: 'button',
            handler: 'downloadZip',
            reference: 'downloadBtn',
            disabled: true,
            hidden: true,
        },
        {
            text: gettext('Download as'),
            xtype: 'button',
            reference: 'menuBtn',
            menu: {
                items: [
                    {
                        iconCls: 'fa fa-fw fa-file-zip-o',
                        text: gettext('.zip'),
                        handler: 'downloadZip',
                        reference: 'downloadZip',
                    },
                    {
                        iconCls: 'fa fa-fw fa-archive',
                        text: gettext('.tar.zst'),
                        handler: 'downloadTar',
                        reference: 'downloadTar',
                    },
                ],
            },
        },
    ],
});
Ext.define('Proxmox.window.AuthEditBase', {
    extend: 'Proxmox.window.Edit',
    mixins: ['Proxmox.Mixin.CBind'],

    showDefaultRealm: false,

    isAdd: true,

    fieldDefaults: {
        labelWidth: 120,
    },

    baseurl: '/access/domains',
    useTypeInUrl: false,

    initComponent: function () {
        var me = this;

        me.isCreate = !me.realm;

        me.url = `/api2/extjs${me.baseUrl}`;
        if (me.useTypeInUrl) {
            me.url += `/${me.authType}`;
        }

        if (me.isCreate) {
            me.method = 'POST';
        } else {
            me.url += `/${me.realm}`;
            me.method = 'PUT';
        }

        let authConfig = Proxmox.Schema.authDomains[me.authType];
        if (!authConfig) {
            throw `unknown auth type ${me.authType}`;
        } else if (!authConfig.add && me.isCreate) {
            throw `trying to add non addable realm of type ${me.authType}`;
        }

        me.subject = authConfig.name;

        let items;
        let bodyPadding;
        if (authConfig.syncipanel) {
            bodyPadding = 0;
            items = {
                xtype: 'tabpanel',
                region: 'center',
                layout: 'fit',
                bodyPadding: 10,
                items: [
                    {
                        title: gettext('General'),
                        realm: me.realm,
                        xtype: authConfig.ipanel,
                        isCreate: me.isCreate,
                        useTypeInUrl: me.useTypeInUrl,
                        type: me.authType,
                        showDefaultRealm: me.showDefaultRealm,
                    },
                    {
                        title: gettext('Sync Options'),
                        realm: me.realm,
                        xtype: authConfig.syncipanel,
                        isCreate: me.isCreate,
                        type: me.authType,
                    },
                ],
            };
        } else {
            items = [
                {
                    realm: me.realm,
                    xtype: authConfig.ipanel,
                    isCreate: me.isCreate,
                    useTypeInUrl: me.useTypeInUrl,
                    type: me.authType,
                    showDefaultRealm: me.showDefaultRealm,
                },
            ];
        }

        Ext.apply(me, {
            items,
            bodyPadding,
        });

        me.callParent();

        if (!me.isCreate) {
            me.load({
                success: function (response, options) {
                    var data = response.result.data || {};
                    // just to be sure (should not happen)
                    // only check this when the type is not in the api path
                    if (!me.useTypeInUrl && data.type !== me.authType) {
                        me.close();
                        throw `got wrong auth type '${me.authType}' for realm '${data.type}'`;
                    }
                    me.setValues(data);
                },
            });
        }
    },
});
Ext.define('Proxmox.panel.OpenIDInputPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxAuthOpenIDPanel',
    mixins: ['Proxmox.Mixin.CBind'],

    showDefaultRealm: false,

    type: 'openid',

    onGetValues: function (values) {
        let me = this;

        if (me.isCreate && !me.useTypeInUrl) {
            values.type = me.type;
        }

        return values;
    },

    columnT: [
        {
            xtype: 'textfield',
            name: 'issuer-url',
            fieldLabel: gettext('Issuer URL'),
            allowBlank: false,
        },
    ],

    column1: [
        {
            xtype: 'pmxDisplayEditField',
            name: 'realm',
            cbind: {
                value: '{realm}',
                editable: '{isCreate}',
            },
            fieldLabel: gettext('Realm'),
            allowBlank: false,
        },
        {
            xtype: 'proxmoxcheckbox',
            fieldLabel: gettext('Default Realm'),
            name: 'default',
            value: 0,
            cbind: {
                deleteEmpty: '{!isCreate}',
                hidden: '{!showDefaultRealm}',
                disabled: '{!showDefaultRealm}',
            },
            autoEl: {
                tag: 'div',
                'data-qtip': gettext('Set realm as default for login'),
            },
        },
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('Client ID'),
            name: 'client-id',
            allowBlank: false,
        },
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('Client Key'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
            name: 'client-key',
        },
    ],

    column2: [
        {
            xtype: 'proxmoxcheckbox',
            fieldLabel: gettext('Autocreate Users'),
            name: 'autocreate',
            value: 0,
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
        {
            xtype: 'pmxDisplayEditField',
            name: 'username-claim',
            fieldLabel: gettext('Username Claim'),
            editConfig: {
                xtype: 'proxmoxKVComboBox',
                editable: true,
                comboItems: [
                    ['__default__', Proxmox.Utils.defaultText],
                    ['subject', 'subject'],
                    ['username', 'username'],
                    ['email', 'email'],
                ],
            },
            cbind: {
                value: (get) => (get('isCreate') ? '__default__' : Proxmox.Utils.defaultText),
                deleteEmpty: '{!isCreate}',
                editable: '{isCreate}',
            },
        },
        {
            xtype: 'proxmoxtextfield',
            name: 'scopes',
            fieldLabel: gettext('Scopes'),
            emptyText: `${Proxmox.Utils.defaultText} (email profile)`,
            submitEmpty: false,
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
        {
            xtype: 'proxmoxKVComboBox',
            name: 'prompt',
            fieldLabel: gettext('Prompt'),
            editable: true,
            emptyText: gettext('Auth-Provider Default'),
            comboItems: [
                ['__default__', gettext('Auth-Provider Default')],
                ['none', 'none'],
                ['login', 'login'],
                ['consent', 'consent'],
                ['select_account', 'select_account'],
            ],
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],

    columnB: [
        {
            xtype: 'proxmoxtextfield',
            name: 'comment',
            fieldLabel: gettext('Comment'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],

    advancedColumnB: [
        {
            xtype: 'proxmoxtextfield',
            name: 'acr-values',
            fieldLabel: gettext('ACR Values'),
            submitEmpty: false,
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],
});
Ext.define('Proxmox.panel.LDAPInputPanelViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.pmxAuthLDAPPanel',

    data: {
        mode: 'ldap',
        anonymous_search: 1,
    },

    formulas: {
        tls_enabled: function (get) {
            return get('mode') !== 'ldap';
        },
    },
});

Ext.define('Proxmox.panel.LDAPInputPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxAuthLDAPPanel',
    mixins: ['Proxmox.Mixin.CBind'],

    showDefaultRealm: false,

    viewModel: {
        type: 'pmxAuthLDAPPanel',
    },

    type: 'ldap',

    onlineHelp: 'user-realms-ldap',

    onGetValues: function (values) {
        if (this.isCreate && !this.useTypeInUrl) {
            values.type = this.type;
        }

        if (values.anonymous_search && !this.isCreate) {
            if (!values.delete) {
                values.delete = [];
            }

            if (!Array.isArray(values.delete)) {
                let tmp = values.delete;
                values.delete = [];
                values.delete.push(tmp);
            }

            values.delete.push('bind-dn');
            values.delete.push('password');
        }

        delete values.anonymous_search;

        return values;
    },

    onSetValues: function (values) {
        let me = this;
        values.anonymous_search = values['bind-dn'] ? 0 : 1;
        me.getViewModel().set('anonymous_search', values.anonymous_search);

        return values;
    },

    cbindData: function (config) {
        return {
            isLdap: this.type === 'ldap',
            isAd: this.type === 'ad',
        };
    },

    column1: [
        {
            xtype: 'pmxDisplayEditField',
            name: 'realm',
            cbind: {
                value: '{realm}',
                editable: '{isCreate}',
            },
            fieldLabel: gettext('Realm'),
            allowBlank: false,
        },
        {
            xtype: 'proxmoxcheckbox',
            fieldLabel: gettext('Default Realm'),
            name: 'default',
            value: 0,
            cbind: {
                deleteEmpty: '{!isCreate}',
                hidden: '{!showDefaultRealm}',
                disabled: '{!showDefaultRealm}',
            },
            autoEl: {
                tag: 'div',
                'data-qtip': gettext('Set realm as default for login'),
            },
        },
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('Base Domain Name'),
            name: 'base-dn',
            emptyText: 'cn=Users,dc=company,dc=net',
            cbind: {
                hidden: '{!isLdap}',
                allowBlank: '{!isLdap}',
            },
        },
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('User Attribute Name'),
            name: 'user-attr',
            emptyText: 'uid / sAMAccountName',
            cbind: {
                hidden: '{!isLdap}',
                allowBlank: '{!isLdap}',
            },
        },
        {
            xtype: 'proxmoxcheckbox',
            fieldLabel: gettext('Anonymous Search'),
            name: 'anonymous_search',
            bind: {
                value: '{anonymous_search}',
            },
        },
        {
            xtype: 'proxmoxtextfield',
            fieldLabel: gettext('Bind Domain Name'),
            name: 'bind-dn',
            allowBlank: false,
            cbind: {
                emptyText: (get) =>
                    get('isAd') ? 'user@company.net' : 'cn=user,dc=company,dc=net',
                autoEl: (get) =>
                    get('isAd')
                        ? {
                              tag: 'div',
                              'data-qtip': gettext(
                                  'LDAP DN syntax can be used as well, e.g. cn=user,dc=company,dc=net',
                              ),
                          }
                        : {},
            },
            bind: {
                disabled: '{anonymous_search}',
            },
        },
        {
            xtype: 'proxmoxtextfield',
            inputType: 'password',
            fieldLabel: gettext('Bind Password'),
            name: 'password',
            cbind: {
                emptyText: (get) => (!get('isCreate') ? gettext('Unchanged') : ''),
                allowBlank: '{!isCreate}',
            },
            bind: {
                disabled: '{anonymous_search}',
            },
        },
    ],

    column2: [
        {
            xtype: 'proxmoxtextfield',
            name: 'server1',
            fieldLabel: gettext('Server'),
            allowBlank: false,
        },
        {
            xtype: 'proxmoxtextfield',
            name: 'server2',
            fieldLabel: gettext('Fallback Server'),
            submitEmpty: false,
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
        {
            xtype: 'proxmoxintegerfield',
            name: 'port',
            fieldLabel: gettext('Port'),
            minValue: 1,
            maxValue: 65535,
            emptyText: gettext('Default'),
            submitEmptyText: false,
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
        {
            xtype: 'proxmoxKVComboBox',
            name: 'mode',
            fieldLabel: gettext('Mode'),
            editable: false,
            comboItems: [
                ['ldap', 'LDAP'],
                ['ldap+starttls', 'STARTTLS'],
                ['ldaps', 'LDAPS'],
            ],
            bind: '{mode}',
            cbind: {
                deleteEmpty: '{!isCreate}',
                value: (get) => (get('isCreate') ? 'ldap' : 'LDAP'),
            },
        },
        {
            xtype: 'proxmoxcheckbox',
            fieldLabel: gettext('Verify Certificate'),
            name: 'verify',
            value: 0,
            cbind: {
                deleteEmpty: '{!isCreate}',
            },

            bind: {
                disabled: '{!tls_enabled}',
            },
            autoEl: {
                tag: 'div',
                'data-qtip': gettext('Verify TLS certificate of the server'),
            },
        },
    ],

    columnB: [
        {
            xtype: 'proxmoxtextfield',
            name: 'comment',
            fieldLabel: gettext('Comment'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],
});

Ext.define('Proxmox.panel.LDAPSyncInputPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxAuthLDAPSyncPanel',
    mixins: ['Proxmox.Mixin.CBind'],

    editableAttributes: ['firstname', 'lastname', 'email'],
    editableDefaults: ['scope', 'enable-new'],
    default_opts: {},
    sync_attributes: {},

    type: 'ldap',

    // (de)construct the sync-attributes from the list above,
    // not touching all others
    onGetValues: function (values) {
        let me = this;

        me.editableDefaults.forEach((attr) => {
            if (values[attr]) {
                me.default_opts[attr] = values[attr];
                delete values[attr];
            } else {
                delete me.default_opts[attr];
            }
        });
        let vanished_opts = [];
        ['acl', 'entry', 'properties'].forEach((prop) => {
            if (values[`remove-vanished-${prop}`]) {
                vanished_opts.push(prop);
            }
            delete values[`remove-vanished-${prop}`];
        });
        me.default_opts['remove-vanished'] = vanished_opts.join(';');

        values['sync-defaults-options'] = Proxmox.Utils.printPropertyString(me.default_opts);
        me.editableAttributes.forEach((attr) => {
            if (values[attr]) {
                me.sync_attributes[attr] = values[attr];
                delete values[attr];
            } else {
                delete me.sync_attributes[attr];
            }
        });
        values['sync-attributes'] = Proxmox.Utils.printPropertyString(me.sync_attributes);

        Proxmox.Utils.delete_if_default(values, 'sync-defaults-options');
        Proxmox.Utils.delete_if_default(values, 'sync-attributes');

        // Force values.delete to be an array
        if (typeof values.delete === 'string') {
            values.delete = values.delete.split(',');
        }

        if (me.isCreate) {
            delete values.delete; // on create we cannot delete values
        }

        return values;
    },

    setValues: function (values) {
        let me = this;

        if (values['sync-attributes']) {
            me.sync_attributes = Proxmox.Utils.parsePropertyString(values['sync-attributes']);
            delete values['sync-attributes'];
            me.editableAttributes.forEach((attr) => {
                if (me.sync_attributes[attr]) {
                    values[attr] = me.sync_attributes[attr];
                }
            });
        }
        if (values['sync-defaults-options']) {
            me.default_opts = Proxmox.Utils.parsePropertyString(values['sync-defaults-options']);
            delete values.default_opts;
            me.editableDefaults.forEach((attr) => {
                if (me.default_opts[attr]) {
                    values[attr] = me.default_opts[attr];
                }
            });

            if (me.default_opts['remove-vanished']) {
                let opts = me.default_opts['remove-vanished'].split(';');
                for (const opt of opts) {
                    values[`remove-vanished-${opt}`] = 1;
                }
            }
        }
        return me.callParent([values]);
    },

    column1: [
        {
            xtype: 'proxmoxtextfield',
            name: 'firstname',
            fieldLabel: gettext('First Name attribute'),
            autoEl: {
                tag: 'div',
                'data-qtip': Ext.String.format(gettext('Often called {0}'), '`givenName`'),
            },
        },
        {
            xtype: 'proxmoxtextfield',
            name: 'lastname',
            fieldLabel: gettext('Last Name attribute'),
            autoEl: {
                tag: 'div',
                'data-qtip': Ext.String.format(gettext('Often called {0}'), '`sn`'),
            },
        },
        {
            xtype: 'proxmoxtextfield',
            name: 'email',
            fieldLabel: gettext('E-Mail attribute'),
            autoEl: {
                tag: 'div',
                'data-qtip': (get) =>
                    get('isAd')
                        ? Ext.String.format(
                              gettext('Often called {0} or {1}'),
                              '`userPrincipalName`',
                              '`mail`',
                          )
                        : Ext.String.format(gettext('Often called {0}'), '`mail`'),
            },
        },
        {
            xtype: 'displayfield',
            value: gettext('Default Sync Options'),
        },
        {
            xtype: 'proxmoxKVComboBox',
            value: '__default__',
            deleteEmpty: false,
            comboItems: [
                [
                    '__default__',
                    Ext.String.format(
                        gettext('{0} ({1})'),
                        Proxmox.Utils.yesText,
                        Proxmox.Utils.defaultText,
                    ),
                ],
                ['true', Proxmox.Utils.yesText],
                ['false', Proxmox.Utils.noText],
            ],
            name: 'enable-new',
            fieldLabel: gettext('Enable new users'),
        },
    ],

    column2: [
        {
            xtype: 'proxmoxtextfield',
            name: 'user-classes',
            fieldLabel: gettext('User classes'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
            emptyText: 'inetorgperson, posixaccount, person, user',
            autoEl: {
                tag: 'div',
                'data-qtip': gettext(
                    'Default user classes: inetorgperson, posixaccount, person, user',
                ),
            },
        },
        {
            xtype: 'proxmoxtextfield',
            name: 'filter',
            fieldLabel: gettext('User Filter'),
            cbind: {
                deleteEmpty: '{!isCreate}',
            },
        },
    ],

    columnB: [
        {
            xtype: 'fieldset',
            title: gettext('Remove Vanished Options'),
            items: [
                {
                    xtype: 'proxmoxcheckbox',
                    fieldLabel: gettext('ACL'),
                    name: 'remove-vanished-acl',
                    boxLabel: gettext('Remove ACLs of vanished users'),
                },
                {
                    xtype: 'proxmoxcheckbox',
                    fieldLabel: gettext('Entry'),
                    name: 'remove-vanished-entry',
                    boxLabel: gettext('Remove vanished user'),
                },
                {
                    xtype: 'proxmoxcheckbox',
                    fieldLabel: gettext('Properties'),
                    name: 'remove-vanished-properties',
                    boxLabel: gettext('Remove vanished properties from synced users.'),
                },
            ],
        },
    ],
});
Ext.define('Proxmox.panel.ADInputPanel', {
    extend: 'Proxmox.panel.LDAPInputPanel',
    xtype: 'pmxAuthADPanel',

    type: 'ad',
    onlineHelp: 'user-realms-ad',
});

Ext.define('Proxmox.panel.ADSyncInputPanel', {
    extend: 'Proxmox.panel.LDAPSyncInputPanel',
    xtype: 'pmxAuthADSyncPanel',

    type: 'ad',
});
Ext.define('Proxmox.panel.SimpleRealmInputPanel', {
    extend: 'Proxmox.panel.InputPanel',
    xtype: 'pmxAuthSimplePanel',
    mixins: ['Proxmox.Mixin.CBind'],

    showDefaultRealm: false,

    column1: [
        {
            xtype: 'pmxDisplayEditField',
            name: 'realm',
            cbind: {
                value: '{realm}',
            },
            fieldLabel: gettext('Realm'),
        },
        {
            xtype: 'proxmoxcheckbox',
            fieldLabel: gettext('Default Realm'),
            name: 'default',
            value: 0,
            deleteEmpty: true,
            autoEl: {
                tag: 'div',
                'data-qtip': gettext('Set realm as default for login'),
            },
            cbind: {
                hidden: '{!showDefaultRealm}',
                disabled: '{!showDefaultRealm}',
            },
        },
    ],

    column2: [],

    columnB: [
        {
            xtype: 'proxmoxtextfield',
            name: 'comment',
            fieldLabel: gettext('Comment'),
            allowBlank: true,
            deleteEmpty: true,
        },
    ],
});
/*global u2f*/
Ext.define('Proxmox.window.TfaLoginWindow', {
    extend: 'Ext.window.Window',
    mixins: ['Proxmox.Mixin.CBind'],

    title: gettext('Second login factor required'),

    modal: true,
    resizable: false,
    width: 512,
    layout: {
        type: 'vbox',
        align: 'stretch',
    },

    defaultButton: 'tfaButton',

    viewModel: {
        data: {
            confirmText: gettext('Confirm Second Factor'),
            canConfirm: false,
            availableChallenge: {},
        },
    },

    cancelled: true,

    controller: {
        xclass: 'Ext.app.ViewController',

        init: function (view) {
            let me = this;
            let vm = me.getViewModel();

            if (!view.userid) {
                throw 'no userid given';
            }
            if (!view.ticket) {
                throw 'no ticket given';
            }
            const challenge = view.challenge;
            if (!challenge) {
                throw 'no challenge given';
            }

            let lastTabId = me.getLastTabUsed();
            let initialTab = -1,
                i = 0;
            let count2nd = 0;
            let hasRecovery = false;
            for (const k of ['webauthn', 'totp', 'recovery', 'u2f', 'yubico']) {
                const available = !!challenge[k];
                vm.set(`availableChallenge.${k}`, available);

                if (available) {
                    count2nd++;
                    if (k === 'recovery') {
                        hasRecovery = true;
                    }
                    if (i === lastTabId) {
                        initialTab = i;
                    } else if (initialTab < 0) {
                        initialTab = i;
                    }
                }
                i++;
            }
            if (!count2nd || (count2nd === 1 && hasRecovery && !challenge.recovery.length)) {
                // no 2nd factors available (and if recovery keys are configured they're empty)
                me.lookup('cannotLogin').setVisible(true);
                me.lookup('recoveryKey').setVisible(false);
                view.down('tabpanel').setActiveTab(2); // recovery
                return;
            }
            view.down('tabpanel').setActiveTab(initialTab);

            if (challenge.recovery) {
                if (!view.challenge.recovery.length) {
                    me.lookup('recoveryEmpty').setVisible(true);
                    me.lookup('recoveryKey').setVisible(false);
                } else {
                    let idList = view.challenge.recovery
                        .map((id) => Ext.String.format(gettext('ID {0}'), id))
                        .join(', ');
                    me.lookup('availableRecovery').update(
                        Ext.String.htmlEncode(
                            Ext.String.format(gettext('Available recovery keys: {0}'), idList),
                        ),
                    );
                    me.lookup('availableRecovery').setVisible(true);
                    if (view.challenge.recovery.length <= 3) {
                        me.lookup('recoveryLow').setVisible(true);
                    }
                }
            }

            if (challenge.webauthn && initialTab === 0) {
                let _promise = me.loginWebauthn();
            } else if (challenge.u2f && initialTab === 3) {
                let _promise = me.loginU2F();
            }
        },
        control: {
            tabpanel: {
                tabchange: function (tabPanel, newCard, oldCard) {
                    // for now every TFA method has at max one field, so keep it simple..
                    let oldField = oldCard.down('field');
                    if (oldField) {
                        oldField.setDisabled(true);
                    }
                    let newField = newCard.down('field');
                    if (newField) {
                        newField.setDisabled(false);
                        newField.focus();
                        newField.validate();
                    }

                    let confirmText = newCard.confirmText || gettext('Confirm Second Factor');
                    this.getViewModel().set('confirmText', confirmText);

                    this.saveLastTabUsed(tabPanel, newCard);
                },
            },
            field: {
                validitychange: function (field, valid) {
                    // triggers only for enabled fields and we disable the one from the
                    // non-visible tab, so we can just directly use the valid param
                    this.getViewModel().set('canConfirm', valid);
                },
                afterrender: (field) => field.focus(), // ensure focus after initial render
            },
        },

        saveLastTabUsed: function (tabPanel, card) {
            let id = tabPanel.items.indexOf(card);
            window.localStorage.setItem('Proxmox.TFALogin.lastTab', JSON.stringify({ id }));
        },

        getLastTabUsed: function () {
            let data = window.localStorage.getItem('Proxmox.TFALogin.lastTab');
            if (typeof data === 'string') {
                let last = JSON.parse(data);
                return last.id;
            }
            return null;
        },

        onClose: function () {
            let me = this;
            let view = me.getView();

            if (!view.cancelled) {
                return;
            }

            view.onReject();
        },

        cancel: function () {
            this.getView().close();
        },

        loginTotp: function () {
            let me = this;

            let code = me.lookup('totp').getValue();
            let _promise = me.finishChallenge(`totp:${code}`);
        },

        loginYubico: function () {
            let me = this;

            let code = me.lookup('yubico').getValue();
            let _promise = me.finishChallenge(`yubico:${code}`);
        },

        loginWebauthn: async function () {
            let me = this;
            let view = me.getView();

            me.lookup('webAuthnWaiting').setVisible(true);
            me.lookup('webAuthnError').setVisible(false);

            let challenge = view.challenge.webauthn;

            if (typeof challenge.string !== 'string') {
                // Byte array fixup, keep challenge string:
                challenge.string = challenge.publicKey.challenge;
                challenge.publicKey.challenge = Proxmox.Utils.base64url_to_bytes(challenge.string);
                for (const cred of challenge.publicKey.allowCredentials) {
                    cred.id = Proxmox.Utils.base64url_to_bytes(cred.id);
                }
            }

            let controller = new AbortController();
            challenge.signal = controller.signal;

            let hwrsp;
            try {
                //Promise.race( ...
                hwrsp = await navigator.credentials.get(challenge);
            } catch (error) {
                // we do NOT want to fail login because of canceling the challenge actively,
                // in some browser that's the only way to switch over to another method as the
                // disallow user input during the time the challenge is active
                // checking for error.code === DOMException.ABORT_ERR only works in firefox -.-
                this.getViewModel().set('canConfirm', true);
                // FIXME: better handling, show some message, ...?
                me.lookup('webAuthnError').setData({
                    error: Ext.htmlEncode(error.toString()),
                });
                me.lookup('webAuthnError').setVisible(true);
                return;
            } finally {
                let waitingMessage = me.lookup('webAuthnWaiting');
                if (waitingMessage) {
                    waitingMessage.setVisible(false);
                }
            }

            let response = {
                id: hwrsp.id,
                type: hwrsp.type,
                challenge: challenge.string,
                rawId: Proxmox.Utils.bytes_to_base64url(hwrsp.rawId),
                response: {
                    authenticatorData: Proxmox.Utils.bytes_to_base64url(
                        hwrsp.response.authenticatorData,
                    ),
                    clientDataJSON: Proxmox.Utils.bytes_to_base64url(hwrsp.response.clientDataJSON),
                    signature: Proxmox.Utils.bytes_to_base64url(hwrsp.response.signature),
                },
            };

            await me.finishChallenge('webauthn:' + JSON.stringify(response));
        },

        loginU2F: async function () {
            let me = this;
            let view = me.getView();

            me.lookup('u2fWaiting').setVisible(true);
            me.lookup('u2fError').setVisible(false);

            let hwrsp;
            try {
                hwrsp = await new Promise((resolve, reject) => {
                    try {
                        let data = view.challenge.u2f;
                        let chlg = data.challenge;
                        u2f.sign(chlg.appId, chlg.challenge, data.keys, resolve);
                    } catch (error) {
                        reject(error);
                    }
                });
                if (hwrsp.errorCode) {
                    throw Proxmox.Utils.render_u2f_error(hwrsp.errorCode);
                }
                delete hwrsp.errorCode;
            } catch (error) {
                this.getViewModel().set('canConfirm', true);
                me.lookup('u2fError').setData({
                    error: Ext.htmlEncode(error.toString()),
                });
                me.lookup('u2fError').setVisible(true);
                return;
            } finally {
                let waitingMessage = me.lookup('u2fWaiting');
                if (waitingMessage) {
                    waitingMessage.setVisible(false);
                }
            }

            await me.finishChallenge('u2f:' + JSON.stringify(hwrsp));
        },

        loginRecovery: function () {
            let me = this;

            let key = me.lookup('recoveryKey').getValue();
            let _promise = me.finishChallenge(`recovery:${key}`);
        },

        loginTFA: function () {
            let me = this;
            // avoid triggering more than once during challenge
            me.getViewModel().set('canConfirm', false);
            let view = me.getView();
            let tfaPanel = view.down('tabpanel').getActiveTab();
            me[tfaPanel.handler]();
        },

        finishChallenge: function (password) {
            let me = this;
            let view = me.getView();
            view.cancelled = false;

            let params = {
                username: view.userid,
                'tfa-challenge': view.ticket,
                password,
            };

            if (view.http_only === true) {
                params['http-only'] = true;
            }

            let resolve = view.onResolve;
            let reject = view.onReject;
            view.close();

            return Proxmox.Async.api2({
                url: '/api2/extjs/access/ticket',
                method: 'POST',
                params,
            })
                .then(resolve)
                .catch(reject);
        },
    },

    listeners: {
        close: 'onClose',
    },

    items: [
        {
            xtype: 'tabpanel',
            region: 'center',
            layout: 'fit',
            bodyPadding: 10,
            items: [
                {
                    xtype: 'panel',
                    title: 'WebAuthn',
                    iconCls: 'fa fa-fw fa-shield',
                    confirmText: gettext('Start WebAuthn challenge'),
                    handler: 'loginWebauthn',
                    bind: {
                        disabled: '{!availableChallenge.webauthn}',
                    },
                    items: [
                        {
                            xtype: 'box',
                            html: gettext(
                                'Please insert your authentication device and press its button',
                            ),
                        },
                        {
                            xtype: 'box',
                            html:
                                gettext('Waiting for second factor.') +
                                `<i class="fa fa-refresh fa-spin fa-fw"></i>`,
                            reference: 'webAuthnWaiting',
                            hidden: true,
                        },
                        {
                            xtype: 'box',
                            data: {
                                error: '',
                            },
                            tpl: '<i class="fa fa-warning warning"></i> {error}',
                            reference: 'webAuthnError',
                            hidden: true,
                        },
                    ],
                },
                {
                    xtype: 'panel',
                    title: gettext('TOTP App'),
                    iconCls: 'fa fa-fw fa-clock-o',
                    handler: 'loginTotp',
                    bind: {
                        disabled: '{!availableChallenge.totp}',
                    },
                    items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: gettext('Please enter your TOTP verification code'),
                            labelWidth: 300,
                            name: 'totp',
                            disabled: true,
                            reference: 'totp',
                            allowBlank: false,
                            regex: /^[0-9]{2,16}$/,
                            regexText: gettext('TOTP codes usually consist of six decimal digits'),
                            inputAttrTpl: 'autocomplete=one-time-code',
                        },
                    ],
                },
                {
                    xtype: 'panel',
                    title: gettext('Recovery Key'),
                    iconCls: 'fa fa-fw fa-file-text-o',
                    handler: 'loginRecovery',
                    bind: {
                        disabled: '{!availableChallenge.recovery}',
                    },
                    items: [
                        {
                            xtype: 'box',
                            reference: 'cannotLogin',
                            hidden: true,
                            html:
                                '<i class="fa fa-exclamation-triangle warning"></i>' +
                                Ext.String.format(
                                    gettext(
                                        'No second factor left! Please contact an administrator!',
                                    ),
                                    4,
                                ),
                        },
                        {
                            xtype: 'box',
                            reference: 'recoveryEmpty',
                            hidden: true,
                            html:
                                '<i class="fa fa-exclamation-triangle warning"></i>' +
                                Ext.String.format(
                                    gettext(
                                        'No more recovery keys left! Please generate a new set!',
                                    ),
                                    4,
                                ),
                        },
                        {
                            xtype: 'box',
                            reference: 'recoveryLow',
                            hidden: true,
                            html:
                                '<i class="fa fa-exclamation-triangle warning"></i>' +
                                Ext.String.format(
                                    gettext(
                                        'Less than {0} recovery keys available. Please generate a new set after login!',
                                    ),
                                    4,
                                ),
                        },
                        {
                            xtype: 'box',
                            reference: 'availableRecovery',
                            hidden: true,
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: gettext(
                                'Please enter one of your single-use recovery keys',
                            ),
                            labelWidth: 300,
                            name: 'recoveryKey',
                            disabled: true,
                            reference: 'recoveryKey',
                            allowBlank: false,
                            regex: /^[0-9a-f]{4}(-[0-9a-f]{4}){3}$/,
                            regexText: gettext('Does not look like a valid recovery key'),
                        },
                    ],
                },
                {
                    xtype: 'panel',
                    title: 'U2F',
                    iconCls: 'fa fa-fw fa-shield',
                    confirmText: gettext('Start U2F challenge'),
                    handler: 'loginU2F',
                    bind: {
                        disabled: '{!availableChallenge.u2f}',
                    },
                    tabConfig: {
                        bind: {
                            hidden: '{!availableChallenge.u2f}',
                        },
                    },
                    items: [
                        {
                            xtype: 'box',
                            html: gettext(
                                'Please insert your authentication device and press its button',
                            ),
                        },
                        {
                            xtype: 'box',
                            html:
                                gettext('Waiting for second factor.') +
                                `<i class="fa fa-refresh fa-spin fa-fw"></i>`,
                            reference: 'u2fWaiting',
                            hidden: true,
                        },
                        {
                            xtype: 'box',
                            data: {
                                error: '',
                            },
                            tpl: '<i class="fa fa-warning warning"></i> {error}',
                            reference: 'u2fError',
                            hidden: true,
                        },
                    ],
                },
                {
                    xtype: 'panel',
                    title: gettext('Yubico OTP'),
                    iconCls: 'fa fa-fw fa-yahoo',
                    handler: 'loginYubico',
                    bind: {
                        disabled: '{!availableChallenge.yubico}',
                    },
                    tabConfig: {
                        bind: {
                            hidden: '{!availableChallenge.yubico}',
                        },
                    },
                    items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: gettext('Please enter your Yubico OTP code'),
                            labelWidth: 300,
                            name: 'yubico',
                            disabled: true,
                            reference: 'yubico',
                            allowBlank: false,
                            regex: /^[a-z0-9]{30,60}$/, // *should* be 44 but not sure if that's "fixed"
                            regexText: gettext('TOTP codes consist of six decimal digits'),
                        },
                    ],
                },
            ],
        },
    ],

    buttons: [
        {
            handler: 'loginTFA',
            reference: 'tfaButton',
            disabled: true,
            bind: {
                text: '{confirmText}',
                disabled: '{!canConfirm}',
            },
        },
    ],
});
Ext.define('Proxmox.window.AddTfaRecovery', {
    extend: 'Proxmox.window.Edit',
    alias: 'widget.pmxAddTfaRecovery',
    mixins: ['Proxmox.Mixin.CBind'],

    onlineHelp: 'user_mgmt',
    isCreate: true,
    isAdd: true,
    subject: gettext('TFA recovery keys'),
    width: 512,
    method: 'POST',

    fixedUser: false,

    url: '/api2/extjs/access/tfa',
    submitUrl: function (url, values) {
        let userid = values.userid;
        delete values.userid;
        return `${url}/${userid}`;
    },

    apiCallDone: function (success, response) {
        if (!success) {
            return;
        }

        let values = response.result.data.recovery.map((v, i) => `${i}: ${v}`).join('\n');
        Ext.create('Proxmox.window.TfaRecoveryShow', {
            autoShow: true,
            userid: this.getViewModel().get('userid'),
            values,
        });
    },

    viewModel: {
        data: {
            has_entry: false,
            userid: null,
        },
    },

    controller: {
        xclass: 'Ext.app.ViewController',
        hasEntry: async function (userid) {
            let me = this;
            let view = me.getView();

            try {
                await Proxmox.Async.api2({
                    url: `${view.url}/${userid}/recovery`,
                    method: 'GET',
                });
                return true;
            } catch (_response) {
                return false;
            }
        },

        init: function (view) {
            this.onUseridChange(null, Proxmox.UserName);
        },

        onUseridChange: async function (field, userid) {
            let me = this;
            let vm = me.getViewModel();

            me.userid = userid;
            vm.set('userid', userid);

            let has_entry = await me.hasEntry(userid);
            vm.set('has_entry', has_entry);
        },
    },

    items: [
        {
            xtype: 'pmxDisplayEditField',
            name: 'userid',
            cbind: {
                editable: (get) => !get('fixedUser'),
                value: () => Proxmox.UserName,
            },
            fieldLabel: gettext('User'),
            editConfig: {
                xtype: 'pmxUserSelector',
                allowBlank: false,
                validator: function (_value) {
                    return !this.up('window').getViewModel().get('has_entry');
                },
            },
            renderer: Ext.String.htmlEncode,
            listeners: {
                change: 'onUseridChange',
            },
        },
        {
            xtype: 'hiddenfield',
            name: 'type',
            value: 'recovery',
        },
        {
            xtype: 'displayfield',
            bind: {
                hidden: '{!has_entry}',
            },
            hidden: true,
            userCls: 'pmx-hint',
            value: gettext('User already has recovery keys.'),
        },
        {
            xtype: 'textfield',
            name: 'password',
            reference: 'password',
            fieldLabel: gettext('Verify Password'),
            inputType: 'password',
            minLength: 5,
            allowBlank: false,
            validateBlank: true,
            cbind: {
                hidden: () => Proxmox.UserName === 'root@pam',
                disabled: () => Proxmox.UserName === 'root@pam',
                emptyText: () =>
                    Ext.String.format(gettext('Confirm your ({0}) password'), Proxmox.UserName),
            },
        },
    ],
});

Ext.define('Proxmox.window.TfaRecoveryShow', {
    extend: 'Ext.window.Window',
    alias: ['widget.pmxTfaRecoveryShow'],
    mixins: ['Proxmox.Mixin.CBind'],

    width: 600,
    modal: true,
    resizable: false,
    title: gettext('Recovery Keys'),
    onEsc: Ext.emptyFn,

    items: [
        {
            xtype: 'form',
            layout: 'anchor',
            bodyPadding: 10,
            border: false,
            fieldDefaults: {
                anchor: '100%',
            },
            items: [
                {
                    xtype: 'textarea',
                    editable: false,
                    inputId: 'token-secret-value',
                    cbind: {
                        value: '{values}',
                    },
                    fieldStyle: {
                        fontFamily: 'monospace',
                    },
                    height: '160px',
                },
                {
                    xtype: 'displayfield',
                    border: false,
                    padding: '5 0 0 0',
                    userCls: 'pmx-hint',
                    value: gettext('Please record recovery keys - they will only be displayed now'),
                },
            ],
        },
    ],
    buttons: [
        {
            handler: function (b) {
                document.getElementById('token-secret-value').select();
                document.execCommand('copy');
            },
            iconCls: 'fa fa-clipboard',
            text: gettext('Copy Recovery Keys'),
        },
        {
            handler: function (b) {
                let win = this.up('window');
                win.paperkeys(win.values, win.userid);
            },
            iconCls: 'fa fa-print',
            text: gettext('Print Recovery Keys'),
        },
    ],
    paperkeys: function (keyString, userid) {
        let me = this;

        let printFrame = document.createElement('iframe');
        Object.assign(printFrame.style, {
            position: 'fixed',
            right: '0',
            bottom: '0',
            width: '0',
            height: '0',
            border: '0',
        });
        const host = document.location.host;
        const title = document.title;
        const html = `<html><head><script>
	    window.addEventListener('DOMContentLoaded', (ev) => window.print());
	</script><style>@media print and (max-height: 150mm) {
	  h4, p { margin: 0; font-size: 1em; }
	}</style></head><body style="padding: 5px;">
	<h4>Recovery Keys for '${userid}' - ${title} (${host})</h4>
<p style="font-size:1.5em;line-height:1.5em;font-family:monospace;
   white-space:pre-wrap;overflow-wrap:break-word;">
${keyString}
</p>
	</body></html>`;

        printFrame.src = 'data:text/html;base64,' + btoa(html);
        document.body.appendChild(printFrame);
        me.on('destroy', () => document.body.removeChild(printFrame));
    },
});
/*global QRCode*/
Ext.define('Proxmox.window.AddTotp', {
    extend: 'Proxmox.window.Edit',
    alias: 'widget.pmxAddTotp',
    mixins: ['Proxmox.Mixin.CBind'],

    onlineHelp: 'user_mgmt',

    modal: true,
    resizable: false,
    title: gettext('Add a TOTP login factor'),
    width: 512,
    layout: {
        type: 'vbox',
        align: 'stretch',
    },

    isAdd: true,
    userid: undefined,
    tfa_id: undefined,
    issuerName: `Proxmox - ${document?.location?.hostname || 'unknown'}`,
    fixedUser: false,

    updateQrCode: function () {
        let me = this;
        let values = me.lookup('totp_form').getValues();
        let algorithm = values.algorithm;
        if (!algorithm) {
            algorithm = 'SHA1';
        }

        let otpuri =
            'otpauth://totp/' +
            encodeURIComponent(values.issuer) +
            ':' +
            encodeURIComponent(values.userid) +
            '?secret=' +
            values.secret +
            '&period=' +
            values.step +
            '&digits=' +
            values.digits +
            '&algorithm=' +
            algorithm +
            '&issuer=' +
            encodeURIComponent(values.issuer);

        me.getController().getViewModel().set('otpuri', otpuri);
        me.qrcode.makeCode(otpuri);
        me.lookup('challenge').setVisible(true);
        me.down('#qrbox').setVisible(true);
    },

    viewModel: {
        data: {
            valid: false,
            secret: '',
            otpuri: '',
            userid: null,
        },

        formulas: {
            secretEmpty: function (get) {
                return get('secret').length === 0;
            },
        },
    },

    controller: {
        xclass: 'Ext.app.ViewController',
        control: {
            'field[qrupdate=true]': {
                change: function () {
                    this.getView().updateQrCode();
                },
            },
            field: {
                validitychange: function (field, valid) {
                    let me = this;
                    let viewModel = me.getViewModel();
                    let form = me.lookup('totp_form');
                    let challenge = me.lookup('challenge');
                    let password = me.lookup('password');
                    viewModel.set(
                        'valid',
                        form.isValid() && challenge.isValid() && password.isValid(),
                    );
                },
            },
            '#': {
                show: function () {
                    let me = this;
                    let view = me.getView();

                    view.qrdiv = document.createElement('div');
                    view.qrcode = new QRCode(view.qrdiv, {
                        width: 256,
                        height: 256,
                        correctLevel: QRCode.CorrectLevel.M,
                    });
                    view.down('#qrbox').getEl().appendChild(view.qrdiv);

                    view.getController().randomizeSecret();
                },
            },
        },

        randomizeSecret: function () {
            let me = this;
            let rnd = new Uint8Array(32);
            window.crypto.getRandomValues(rnd);
            let data = '';
            rnd.forEach(function (b) {
                // secret must be base32, so just use the first 5 bits
                b = b & 0x1f;
                if (b < 26) {
                    // A..Z
                    data += String.fromCharCode(b + 0x41);
                } else {
                    // 2..7
                    data += String.fromCharCode(b - 26 + 0x32);
                }
            });
            me.getViewModel().set('secret', data);
        },
    },

    items: [
        {
            xtype: 'form',
            layout: 'anchor',
            border: false,
            reference: 'totp_form',
            fieldDefaults: {
                anchor: '100%',
            },
            items: [
                {
                    xtype: 'pmxDisplayEditField',
                    name: 'userid',
                    cbind: {
                        editable: (get) => get('isAdd') && !get('fixedUser'),
                        value: () => Proxmox.UserName,
                    },
                    fieldLabel: gettext('User'),
                    editConfig: {
                        xtype: 'pmxUserSelector',
                        allowBlank: false,
                    },
                    renderer: Ext.String.htmlEncode,
                    listeners: {
                        change: function (field, newValue, oldValue) {
                            let vm = this.up('window').getViewModel();
                            vm.set('userid', newValue);
                        },
                    },
                    qrupdate: true,
                },
                {
                    xtype: 'textfield',
                    fieldLabel: gettext('Description'),
                    emptyText: gettext(
                        'For example: TFA device ID, required to identify multiple factors.',
                    ),
                    allowBlank: false,
                    name: 'description',
                    maxLength: 256,
                },
                {
                    layout: 'hbox',
                    border: false,
                    padding: '0 0 5 0',
                    items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: gettext('Secret'),
                            emptyText: gettext('Unchanged'),
                            name: 'secret',
                            reference: 'tfa_secret',
                            regex: /^[A-Z2-7=]+$/,
                            regexText: 'Must be base32 [A-Z2-7=]',
                            maskRe: /[A-Z2-7=]/,
                            qrupdate: true,
                            bind: {
                                value: '{secret}',
                            },
                            flex: 4,
                            padding: '0 5 0 0',
                        },
                        {
                            xtype: 'button',
                            text: gettext('Randomize'),
                            reference: 'randomize_button',
                            handler: 'randomizeSecret',
                            flex: 1,
                        },
                    ],
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: gettext('Time period'),
                    name: 'step',
                    // Google Authenticator ignores this and generates bogus data
                    hidden: true,
                    value: 30,
                    minValue: 10,
                    qrupdate: true,
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: gettext('Digits'),
                    name: 'digits',
                    value: 6,
                    // Google Authenticator ignores this and generates bogus data
                    hidden: true,
                    minValue: 6,
                    maxValue: 8,
                    qrupdate: true,
                },
                {
                    xtype: 'textfield',
                    fieldLabel: gettext('Issuer Name'),
                    name: 'issuer',
                    cbind: {
                        value: '{issuerName}',
                    },
                    qrupdate: true,
                },
                {
                    xtype: 'box',
                    itemId: 'qrbox',
                    visible: false, // will be enabled when generating a qr code
                    bind: {
                        visible: '{!secretEmpty}',
                    },
                    style: {
                        margin: '16px auto',
                        padding: '16px',
                        width: '288px',
                        height: '288px',
                        'background-color': 'white',
                    },
                },
                {
                    xtype: 'textfield',
                    fieldLabel: gettext('Verify Code'),
                    allowBlank: false,
                    reference: 'challenge',
                    name: 'challenge',
                    bind: {
                        disabled: '{!showTOTPVerifiction}',
                        visible: '{showTOTPVerifiction}',
                    },
                    emptyText: gettext('Scan QR code in a TOTP app and enter an auth. code here'),
                },
                {
                    xtype: 'textfield',
                    name: 'password',
                    reference: 'password',
                    fieldLabel: gettext('Verify Password'),
                    inputType: 'password',
                    minLength: 5,
                    allowBlank: false,
                    validateBlank: true,
                    cbind: {
                        hidden: () => Proxmox.UserName === 'root@pam',
                        disabled: () => Proxmox.UserName === 'root@pam',
                        emptyText: () =>
                            Ext.String.format(
                                gettext('Confirm your ({0}) password'),
                                Proxmox.UserName,
                            ),
                    },
                },
            ],
        },
    ],

    initComponent: function () {
        let me = this;
        me.url = '/api2/extjs/access/tfa/';
        me.method = 'POST';
        me.callParent();
    },

    getValues: function (dirtyOnly) {
        let me = this;
        let viewmodel = me.getController().getViewModel();

        let values = me.callParent(arguments);

        let uid = encodeURIComponent(values.userid);
        me.url = `/api2/extjs/access/tfa/${uid}`;
        delete values.userid;

        let data = {
            description: values.description,
            type: 'totp',
            totp: viewmodel.get('otpuri'),
            value: values.challenge,
        };

        if (values.password) {
            data.password = values.password;
        }

        return data;
    },
});
Ext.define('Proxmox.window.AddWebauthn', {
    extend: 'Ext.window.Window',
    alias: 'widget.pmxAddWebauthn',
    mixins: ['Proxmox.Mixin.CBind'],

    onlineHelp: 'user_mgmt',

    modal: true,
    resizable: false,
    title: gettext('Add a Webauthn login token'),
    width: 512,

    user: undefined,
    fixedUser: false,

    initComponent: function () {
        let me = this;
        me.callParent();
        Ext.GlobalEvents.fireEvent('proxmoxShowHelp', me.onlineHelp);
    },

    viewModel: {
        data: {
            valid: false,
            userid: null,
        },
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        control: {
            field: {
                validitychange: function (field, valid) {
                    let me = this;
                    let viewmodel = me.getViewModel();
                    let form = me.lookup('webauthn_form');
                    viewmodel.set('valid', form.isValid());
                },
            },
            '#': {
                show: function () {
                    let me = this;
                    let view = me.getView();

                    if (Proxmox.UserName === 'root@pam') {
                        view.lookup('password').setVisible(false);
                        view.lookup('password').setDisabled(true);
                    }
                },
            },
        },

        registerWebauthn: async function () {
            let me = this;
            let values = me.lookup('webauthn_form').getValues();
            values.type = 'webauthn';

            let userid = values.user;
            delete values.user;

            me.getView().mask(gettext('Please wait...'), 'x-mask-loading');

            try {
                let register_response = await Proxmox.Async.api2({
                    url: `/api2/extjs/access/tfa/${userid}`,
                    method: 'POST',
                    params: values,
                });

                let data = register_response.result.data;
                if (!data.challenge) {
                    throw 'server did not respond with a challenge';
                }

                let creds = JSON.parse(data.challenge);

                // Fix this up before passing it to the browser, but keep a copy of the original
                // string to pass in the response:
                let challenge_str = creds.publicKey.challenge;
                creds.publicKey.challenge = Proxmox.Utils.base64url_to_bytes(challenge_str);
                creds.publicKey.user.id = Proxmox.Utils.base64url_to_bytes(creds.publicKey.user.id);

                // convert existing authenticators structure
                creds.publicKey.excludeCredentials = (creds.publicKey.excludeCredentials || []).map(
                    (credential) => ({
                        id: Proxmox.Utils.base64url_to_bytes(credential.id),
                        type: credential.type,
                    }),
                );

                let msg = Ext.Msg.show({
                    title: `Webauthn: ${gettext('Setup')}`,
                    message: gettext('Please press the button on your Webauthn Device'),
                    buttons: [],
                });

                let token_response;
                try {
                    token_response = await navigator.credentials.create(creds);
                } catch (error) {
                    let errmsg = error.message;
                    if (error.name === 'InvalidStateError') {
                        errmsg = gettext('Is this token already registered?');
                    }
                    throw (
                        gettext('An error occurred during token registration.') +
                        `<br>${error.name}: ${errmsg}`
                    );
                }

                // We cannot pass ArrayBuffers to the API, so extract & convert the data.
                let response = {
                    id: token_response.id,
                    type: token_response.type,
                    rawId: Proxmox.Utils.bytes_to_base64url(token_response.rawId),
                    response: {
                        attestationObject: Proxmox.Utils.bytes_to_base64url(
                            token_response.response.attestationObject,
                        ),
                        clientDataJSON: Proxmox.Utils.bytes_to_base64url(
                            token_response.response.clientDataJSON,
                        ),
                    },
                };

                msg.close();

                let params = {
                    type: 'webauthn',
                    challenge: challenge_str,
                    value: JSON.stringify(response),
                };

                if (values.password) {
                    params.password = values.password;
                }

                await Proxmox.Async.api2({
                    url: `/api2/extjs/access/tfa/${userid}`,
                    method: 'POST',
                    params,
                });
            } catch (response) {
                let error = response;
                console.error(error); // for debugging if it's not displayable...
                if (typeof error === 'object') {
                    // in case it came from an api request:
                    error = error.result?.message;
                }

                Ext.Msg.alert(gettext('Error'), error);
            }

            me.getView().close();
        },
    },

    items: [
        {
            xtype: 'form',
            reference: 'webauthn_form',
            layout: 'anchor',
            border: false,
            bodyPadding: 10,
            fieldDefaults: {
                anchor: '100%',
            },
            items: [
                {
                    xtype: 'pmxDisplayEditField',
                    name: 'user',
                    cbind: {
                        editable: (get) => !get('fixedUser'),
                        value: () => Proxmox.UserName,
                    },
                    fieldLabel: gettext('User'),
                    editConfig: {
                        xtype: 'pmxUserSelector',
                        allowBlank: false,
                    },
                    renderer: Ext.String.htmlEncode,
                    listeners: {
                        change: function (field, newValue, oldValue) {
                            let vm = this.up('window').getViewModel();
                            vm.set('userid', newValue);
                        },
                    },
                },
                {
                    xtype: 'textfield',
                    fieldLabel: gettext('Description'),
                    allowBlank: false,
                    name: 'description',
                    maxLength: 256,
                    emptyText: gettext(
                        'For example: TFA device ID, required to identify multiple factors.',
                    ),
                },
                {
                    xtype: 'textfield',
                    name: 'password',
                    reference: 'password',
                    fieldLabel: gettext('Verify Password'),
                    inputType: 'password',
                    minLength: 5,
                    allowBlank: false,
                    validateBlank: true,
                    cbind: {
                        hidden: () => Proxmox.UserName === 'root@pam',
                        disabled: () => Proxmox.UserName === 'root@pam',
                        emptyText: () =>
                            Ext.String.format(
                                gettext('Confirm your ({0}) password'),
                                Proxmox.UserName,
                            ),
                    },
                },
            ],
        },
    ],

    buttons: [
        {
            xtype: 'proxmoxHelpButton',
        },
        '->',
        {
            xtype: 'button',
            text: gettext('Register Webauthn Device'),
            handler: 'registerWebauthn',
            bind: {
                disabled: '{!valid}',
            },
        },
    ],
});
Ext.define('Proxmox.window.AddYubico', {
    extend: 'Proxmox.window.Edit',
    alias: 'widget.pmxAddYubico',
    mixins: ['Proxmox.Mixin.CBind'],

    onlineHelp: 'user_mgmt',

    modal: true,
    resizable: false,
    title: gettext('Add a Yubico OTP key'),
    width: 512,

    isAdd: true,
    userid: undefined,
    fixedUser: false,

    initComponent: function () {
        let me = this;
        me.url = '/api2/extjs/access/tfa/';
        me.method = 'POST';
        me.callParent();
    },

    viewModel: {
        data: {
            valid: false,
            userid: null,
        },
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        control: {
            field: {
                validitychange: function (field, valid) {
                    let me = this;
                    let viewmodel = me.getViewModel();
                    let form = me.lookup('yubico_form');
                    viewmodel.set('valid', form.isValid());
                },
            },
            '#': {
                show: function () {
                    let me = this;
                    let view = me.getView();

                    if (Proxmox.UserName === 'root@pam') {
                        view.lookup('password').setVisible(false);
                        view.lookup('password').setDisabled(true);
                    }
                },
            },
        },
    },

    items: [
        {
            xtype: 'form',
            reference: 'yubico_form',
            layout: 'anchor',
            border: false,
            bodyPadding: 10,
            fieldDefaults: {
                anchor: '100%',
            },
            items: [
                {
                    xtype: 'pmxDisplayEditField',
                    name: 'userid',
                    cbind: {
                        editable: (get) => !get('fixedUser'),
                        value: () => Proxmox.UserName,
                    },
                    fieldLabel: gettext('User'),
                    editConfig: {
                        xtype: 'pmxUserSelector',
                        allowBlank: false,
                    },
                    renderer: Ext.String.htmlEncode,
                    listeners: {
                        change: function (field, newValue, oldValue) {
                            let vm = this.up('window').getViewModel();
                            vm.set('userid', newValue);
                        },
                    },
                },
                {
                    xtype: 'textfield',
                    fieldLabel: gettext('Description'),
                    allowBlank: false,
                    name: 'description',
                    maxLength: 256,
                    emptyText: gettext(
                        'For example: TFA device ID, required to identify multiple factors.',
                    ),
                },
                {
                    xtype: 'textfield',
                    fieldLabel: gettext('Yubico OTP Key'),
                    emptyText: gettext('A currently valid Yubico OTP value'),
                    name: 'otp_value',
                    maxLength: 44,
                    enforceMaxLength: true,
                    regex: /^[a-zA-Z0-9]{44}$/,
                    regexText: '44 characters',
                    maskRe: /^[a-zA-Z0-9]$/,
                },
                {
                    xtype: 'textfield',
                    name: 'password',
                    reference: 'password',
                    fieldLabel: gettext('Verify Password'),
                    inputType: 'password',
                    minLength: 5,
                    allowBlank: false,
                    validateBlank: true,
                    cbind: {
                        hidden: () => Proxmox.UserName === 'root@pam',
                        disabled: () => Proxmox.UserName === 'root@pam',
                        emptyText: () =>
                            Ext.String.format(
                                gettext('Confirm your ({0}) password'),
                                Proxmox.UserName,
                            ),
                    },
                },
                {
                    xtype: 'box',
                    html:
                        `<span class='pmx-hint'>${gettext('Tip:')}</span> ` +
                        gettext(
                            'YubiKeys also support WebAuthn, which is often a better alternative.',
                        ),
                },
            ],
        },
    ],

    getValues: function (dirtyOnly) {
        let me = this;

        let values = me.callParent(arguments);

        let uid = encodeURIComponent(values.userid);
        me.url = `/api2/extjs/access/tfa/${uid}`;
        delete values.userid;

        let data = {
            description: values.description,
            type: 'yubico',
            value: values.otp_value,
        };

        if (values.password) {
            data.password = values.password;
        }

        return data;
    },
});
Ext.define('Proxmox.window.TfaEdit', {
    extend: 'Proxmox.window.Edit',
    alias: 'widget.pmxTfaEdit',
    mixins: ['Proxmox.Mixin.CBind'],

    onlineHelp: 'user_mgmt',

    modal: true,
    resizable: false,
    title: gettext("Modify a TFA entry's description"),
    width: 512,

    layout: {
        type: 'vbox',
        align: 'stretch',
    },

    cbindData: function (initialConfig) {
        let me = this;

        let tfa_id = initialConfig['tfa-id'];
        me.tfa_id = tfa_id;
        me.defaultFocus = 'textfield[name=description]';
        me.url = `/api2/extjs/access/tfa/${tfa_id}`;
        me.method = 'PUT';
        me.autoLoad = true;
        return {};
    },

    initComponent: function () {
        let me = this;
        me.callParent();

        if (Proxmox.UserName === 'root@pam') {
            me.lookup('password').setVisible(false);
            me.lookup('password').setDisabled(true);
        }

        let userid = me.tfa_id.split('/')[0];
        me.lookup('userid').setValue(userid);
    },

    items: [
        {
            xtype: 'displayfield',
            reference: 'userid',
            editable: false,
            fieldLabel: gettext('User'),
            editConfig: {
                xtype: 'pmxUserSelector',
                allowBlank: false,
            },
            cbind: {
                value: () => Proxmox.UserName,
            },
        },
        {
            xtype: 'proxmoxtextfield',
            name: 'description',
            allowBlank: false,
            fieldLabel: gettext('Description'),
        },
        {
            xtype: 'proxmoxcheckbox',
            fieldLabel: gettext('Enabled'),
            name: 'enable',
            uncheckedValue: 0,
            defaultValue: 1,
            checked: true,
        },
        {
            xtype: 'textfield',
            inputType: 'password',
            fieldLabel: gettext('Password'),
            minLength: 5,
            reference: 'password',
            name: 'password',
            allowBlank: false,
            validateBlank: true,
            emptyText: gettext('verify current password'),
        },
    ],

    getValues: function () {
        var me = this;

        var values = me.callParent(arguments);

        delete values.userid;

        return values;
    },
});

Ext.define('Proxmox.tfa.confirmRemove', {
    extend: 'Proxmox.window.Edit',
    mixins: ['Proxmox.Mixin.CBind'],

    title: gettext('Confirm TFA Removal'),

    modal: true,
    resizable: false,
    width: 600,
    isCreate: true, // logic
    isRemove: true,

    url: '/access/tfa',

    initComponent: function () {
        let me = this;

        if (typeof me.type !== 'string') {
            throw 'missing type';
        }

        if (!me.callback) {
            throw 'missing callback';
        }

        me.callParent();

        if (Proxmox.UserName === 'root@pam') {
            me.lookup('password').setVisible(false);
            me.lookup('password').setDisabled(true);
        }
    },

    submit: function () {
        let me = this;
        if (Proxmox.UserName === 'root@pam') {
            me.callback(null);
        } else {
            me.callback(me.lookup('password').getValue());
        }
        me.close();
    },

    items: [
        {
            xtype: 'box',
            padding: '0 0 10 0',
            html: Ext.String.format(
                gettext('Are you sure you want to remove this {0} entry?'),
                'TFA',
            ),
        },
        {
            xtype: 'container',
            layout: {
                type: 'hbox',
                align: 'begin',
            },
            defaults: {
                border: false,
                layout: 'anchor',
                flex: 1,
                padding: 5,
            },
            items: [
                {
                    xtype: 'container',
                    layout: {
                        type: 'vbox',
                    },
                    padding: '0 10 0 0',
                    items: [
                        {
                            xtype: 'displayfield',
                            fieldLabel: gettext('User'),
                            cbind: {
                                value: '{userid}',
                            },
                        },
                        {
                            xtype: 'displayfield',
                            fieldLabel: gettext('Type'),
                            cbind: {
                                value: '{type}',
                            },
                        },
                    ],
                },
                {
                    xtype: 'container',
                    layout: {
                        type: 'vbox',
                    },
                    padding: '0 0 0 10',
                    items: [
                        {
                            xtype: 'displayfield',
                            fieldLabel: gettext('Created'),
                            renderer: (v) => Proxmox.Utils.render_timestamp(v),
                            cbind: {
                                value: '{created}',
                            },
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: gettext('Description'),
                            cbind: {
                                value: '{description}',
                            },
                            emptyText: Proxmox.Utils.NoneText,
                            submitValue: false,
                            editable: false,
                        },
                    ],
                },
            ],
        },
        {
            xtype: 'textfield',
            inputType: 'password',
            fieldLabel: gettext('Password'),
            minLength: 5,
            reference: 'password',
            name: 'password',
            allowBlank: false,
            validateBlank: true,
            padding: '10 0 0 0',
            cbind: {
                emptyText: () =>
                    Ext.String.format(gettext('Confirm your ({0}) password'), Proxmox.UserName),
            },
        },
    ],
});
Ext.define('Proxmox.window.NotesEdit', {
    extend: 'Proxmox.window.Edit',

    title: gettext('Notes'),
    onlineHelp: 'markdown_basics',

    width: 800,
    height: 600,

    resizable: true,
    layout: 'fit',

    autoLoad: true,
    defaultButton: undefined,

    setMaxLength: function (maxLength) {
        let me = this;

        let area = me.down('textarea[name="description"]');
        area.maxLength = maxLength;
        area.validate();

        return me;
    },

    items: {
        xtype: 'textarea',
        name: 'description',
        height: '100%',
        value: '',
        hideLabel: true,
        emptyText: gettext('You can use Markdown for rich text formatting.'),
        fieldStyle: {
            'white-space': 'pre-wrap',
            'font-family': 'monospace',
        },
    },
});
Ext.define('Proxmox.window.ThemeEditWindow', {
    extend: 'Ext.window.Window',
    alias: 'widget.pmxThemeEditWindow',

    viewModel: {
        parent: null,
        data: {},
    },
    controller: {
        xclass: 'Ext.app.ViewController',
        init: function (view) {
            let theme = '__default__';

            let savedTheme = Ext.util.Cookies.get(view.cookieName);
            if (savedTheme && savedTheme in Proxmox.Utils.theme_map) {
                theme = savedTheme;
            }
            this.getViewModel().set('theme', theme);
        },
        applyTheme: function (button) {
            let view = this.getView();
            let vm = this.getViewModel();

            let expire = Ext.Date.add(new Date(), Ext.Date.YEAR, 10);
            Ext.util.Cookies.set(view.cookieName, vm.get('theme'), expire);
            view.mask(gettext('Please wait...'), 'x-mask-loading');
            window.location.reload();
        },
    },

    cookieName: 'PVEThemeCookie',

    title: gettext('Color Theme'),
    modal: true,
    bodyPadding: 10,
    resizable: false,
    items: [
        {
            xtype: 'proxmoxThemeSelector',
            fieldLabel: gettext('Color Theme'),
            bind: {
                value: '{theme}',
            },
        },
    ],
    buttons: [
        {
            text: gettext('Apply'),
            handler: 'applyTheme',
        },
    ],
});
Ext.define('Proxmox.window.SyncWindow', {
    extend: 'Ext.window.Window',

    title: gettext('Realm Sync'),

    width: 600,
    bodyPadding: 10,
    modal: true,
    resizable: false,

    controller: {
        xclass: 'Ext.app.ViewController',

        control: {
            form: {
                validitychange: function (field, valid) {
                    this.lookup('preview_btn').setDisabled(!valid);
                    this.lookup('sync_btn').setDisabled(!valid);
                },
            },
            button: {
                click: function (btn) {
                    this.sync_realm(btn.reference === 'preview_btn');
                },
            },
        },

        sync_realm: function (is_preview) {
            let view = this.getView();
            let ipanel = this.lookup('ipanel');
            let params = ipanel.getValues();

            let vanished_opts = [];
            ['acl', 'entry', 'properties'].forEach((prop) => {
                if (params[`remove-vanished-${prop}`]) {
                    vanished_opts.push(prop);
                }
                delete params[`remove-vanished-${prop}`];
            });
            if (vanished_opts.length > 0) {
                params['remove-vanished'] = vanished_opts.join(';');
            }

            params['dry-run'] = is_preview ? 1 : 0;
            Proxmox.Utils.API2Request({
                url: `/access/domains/${view.realm}/sync`,
                waitMsgTarget: view,
                method: 'POST',
                params,
                failure: (response) => {
                    view.show();
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
                success: (response) => {
                    view.hide();
                    Ext.create('Proxmox.window.TaskViewer', {
                        upid: response.result.data,
                        listeners: {
                            destroy: () => {
                                if (is_preview) {
                                    view.show();
                                } else {
                                    view.close();
                                }
                            },
                        },
                    }).show();
                },
            });
        },
    },

    items: [
        {
            xtype: 'form',
            reference: 'form',
            border: false,
            fieldDefaults: {
                labelWidth: 100,
                anchor: '100%',
            },
            items: [
                {
                    xtype: 'inputpanel',
                    reference: 'ipanel',
                    column1: [
                        {
                            xtype: 'proxmoxKVComboBox',
                            value: 'true',
                            deleteEmpty: false,
                            allowBlank: false,
                            comboItems: [
                                ['true', Proxmox.Utils.yesText],
                                ['false', Proxmox.Utils.noText],
                            ],
                            name: 'enable-new',
                            fieldLabel: gettext('Enable new'),
                        },
                    ],

                    column2: [],

                    columnB: [
                        {
                            xtype: 'fieldset',
                            title: gettext('Remove Vanished Options'),
                            items: [
                                {
                                    xtype: 'proxmoxcheckbox',
                                    fieldLabel: gettext('ACL'),
                                    name: 'remove-vanished-acl',
                                    boxLabel: gettext('Remove ACLs of vanished users and groups.'),
                                },
                                {
                                    xtype: 'proxmoxcheckbox',
                                    fieldLabel: gettext('Entry'),
                                    name: 'remove-vanished-entry',
                                    boxLabel: gettext('Remove vanished user and group entries.'),
                                },
                                {
                                    xtype: 'proxmoxcheckbox',
                                    fieldLabel: gettext('Properties'),
                                    name: 'remove-vanished-properties',
                                    boxLabel: gettext(
                                        'Remove vanished properties from synced users.',
                                    ),
                                },
                            ],
                        },
                        {
                            xtype: 'displayfield',
                            reference: 'defaulthint',
                            value: gettext('Default sync options can be set by editing the realm.'),
                            userCls: 'pmx-hint',
                            hidden: true,
                        },
                    ],
                },
            ],
        },
    ],

    buttons: [
        '->',
        {
            text: gettext('Preview'),
            reference: 'preview_btn',
        },
        {
            text: gettext('Sync'),
            reference: 'sync_btn',
        },
    ],

    initComponent: function () {
        if (!this.realm) {
            throw 'no realm defined';
        }

        if (!this.type) {
            throw 'no realm type defined';
        }

        this.callParent();

        Proxmox.Utils.API2Request({
            url: `/config/access/${this.type}/${this.realm}`,
            waitMsgTarget: this,
            method: 'GET',
            failure: (response) => {
                Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                this.close();
            },
            success: (response) => {
                let default_options = response.result.data['sync-defaults-options'];
                if (default_options) {
                    let options = Proxmox.Utils.parsePropertyString(default_options);
                    if (options['remove-vanished']) {
                        let opts = options['remove-vanished'].split(';');
                        for (const opt of opts) {
                            options[`remove-vanished-${opt}`] = 1;
                        }
                    }
                    let ipanel = this.lookup('ipanel');
                    ipanel.setValues(options);
                } else {
                    this.lookup('defaulthint').setVisible(true);
                }

                // check validity for button state
                this.lookup('form').isValid();
            },
        });
    },
});
Ext.define('apt-pkglist', {
    extend: 'Ext.data.Model',
    fields: [
        'Package',
        'Title',
        'Description',
        'Section',
        'Arch',
        'Priority',
        'Version',
        'OldVersion',
        'Origin',
    ],
    idProperty: 'Package',
});

Ext.define('Proxmox.node.APT', {
    extend: 'Ext.grid.GridPanel',

    xtype: 'proxmoxNodeAPT',

    upgradeBtn: undefined,

    columns: [
        {
            header: gettext('Package'),
            width: 200,
            sortable: true,
            dataIndex: 'Package',
        },
        {
            text: gettext('Version'),
            columns: [
                {
                    header: gettext('current'),
                    width: 100,
                    sortable: false,
                    dataIndex: 'OldVersion',
                },
                {
                    header: gettext('new'),
                    width: 100,
                    sortable: false,
                    dataIndex: 'Version',
                },
            ],
        },
        {
            header: gettext('Description'),
            sortable: false,
            dataIndex: 'Title',
            flex: 1,
        },
    ],

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            throw 'no node name specified';
        }

        let store = Ext.create('Ext.data.Store', {
            model: 'apt-pkglist',
            groupField: 'Origin',
            proxy: {
                type: 'proxmox',
                url: `/api2/json/nodes/${me.nodename}/apt/update`,
            },
            sorters: [
                {
                    property: 'Package',
                    direction: 'ASC',
                },
            ],
        });
        Proxmox.Utils.monStoreErrors(me, store, true);

        let groupingFeature = Ext.create('Ext.grid.feature.Grouping', {
            groupHeaderTpl:
                '{[ "Origin: " + values.name ]} ({rows.length} Item{[values.rows.length > 1 ? "s" : ""]})',
            enableGroupingMenu: false,
        });

        let rowBodyFeature = Ext.create('Ext.grid.feature.RowBody', {
            getAdditionalData: function (data, rowIndex, record, orig) {
                let headerCt = this.view.headerCt;
                let colspan = headerCt.getColumnCount();
                return {
                    rowBody: `<div style="padding: 1em">${Ext.htmlEncode(data.Description)}</div>`,
                    rowBodyCls: me.full_description
                        ? ''
                        : Ext.baseCSSPrefix + 'grid-row-body-hidden',
                    rowBodyColspan: colspan,
                };
            },
        });

        let apt_command = function (cmd) {
            Proxmox.Utils.API2Request({
                url: `/nodes/${me.nodename}/apt/${cmd}`,
                method: 'POST',
                success: ({ result }) =>
                    Ext.create('Proxmox.window.TaskViewer', {
                        autoShow: true,
                        upid: result.data,
                        listeners: {
                            close: () => store.load(),
                        },
                    }),
            });
        };

        let sm = Ext.create('Ext.selection.RowModel', {});

        let update_btn = new Ext.Button({
            text: gettext('Refresh'),
            handler: () =>
                Proxmox.Utils.checked_command(function () {
                    apt_command('update');
                }),
        });

        let show_changelog = function (rec) {
            if (!rec?.data?.Package) {
                console.debug('cannot show changelog, missing Package', rec);
                return;
            }

            let view = Ext.createWidget('component', {
                autoScroll: true,
                style: {
                    'white-space': 'pre',
                    'font-family': 'monospace',
                    padding: '5px',
                },
            });

            let win = Ext.create('Ext.window.Window', {
                title: gettext('Changelog') + ': ' + rec.data.Package,
                width: 800,
                height: 600,
                layout: 'fit',
                modal: true,
                items: [view],
            });

            Proxmox.Utils.API2Request({
                waitMsgTarget: me,
                url: '/nodes/' + me.nodename + '/apt/changelog',
                params: {
                    name: rec.data.Package,
                    version: rec.data.Version,
                },
                method: 'GET',
                failure: function (response, opts) {
                    win.close();
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                },
                success: function (response, opts) {
                    win.show();
                    view.update(Ext.htmlEncode(response.result.data));
                },
            });
        };

        let changelog_btn = new Proxmox.button.Button({
            text: gettext('Changelog'),
            selModel: sm,
            disabled: true,
            enableFn: (rec) => !!rec?.data?.Package,
            handler: (b, e, rec) => show_changelog(rec),
        });

        let verbose_desc_checkbox = new Ext.form.field.Checkbox({
            boxLabel: gettext('Show details'),
            value: false,
            listeners: {
                change: (f, val) => {
                    me.full_description = val;
                    me.getView().refresh();
                },
            },
        });

        if (me.upgradeBtn) {
            me.tbar = [update_btn, me.upgradeBtn, changelog_btn, '->', verbose_desc_checkbox];
        } else {
            me.tbar = [update_btn, changelog_btn, '->', verbose_desc_checkbox];
        }

        Ext.apply(me, {
            store: store,
            stateful: true,
            stateId: 'grid-update',
            selModel: sm,
            viewConfig: {
                stripeRows: false,
                emptyText: `<div style="display:flex;justify-content:center;"><p>${gettext('No updates available.')}</p></div>`,
            },
            features: [groupingFeature, rowBodyFeature],
            listeners: {
                activate: () => store.load(),
                itemdblclick: (v, rec) => show_changelog(rec),
            },
        });

        me.callParent();
    },
});
Ext.define('apt-repolist', {
    extend: 'Ext.data.Model',
    fields: [
        'Path',
        'Index',
        'Origin',
        'FileType',
        'Enabled',
        'Comment',
        'Types',
        'URIs',
        'Suites',
        'Components',
        'Options',
    ],
});

Ext.define('Proxmox.window.APTRepositoryAdd', {
    extend: 'Proxmox.window.Edit',
    alias: 'widget.pmxAPTRepositoryAdd',

    isCreate: true,
    isAdd: true,

    subject: gettext('Repository'),
    width: 600,

    initComponent: function () {
        let me = this;

        if (!me.repoInfo || me.repoInfo.length === 0) {
            throw 'repository information not initialized';
        }

        let description = Ext.create('Ext.form.field.Display', {
            fieldLabel: gettext('Description'),
            name: 'description',
        });

        let status = Ext.create('Ext.form.field.Display', {
            fieldLabel: gettext('Status'),
            name: 'status',
            renderer: function (value) {
                let statusText = gettext('Not yet configured');
                if (value !== '') {
                    statusText = Ext.String.format(
                        '{0}: {1}',
                        gettext('Configured'),
                        value ? gettext('enabled') : gettext('disabled'),
                    );
                }

                return statusText;
            },
        });

        let repoSelector = Ext.create('Proxmox.form.KVComboBox', {
            fieldLabel: gettext('Repository'),
            xtype: 'proxmoxKVComboBox',
            name: 'handle',
            allowBlank: false,
            comboItems: me.repoInfo.map((info) => [info.handle, info.name]),
            validator: function (renderedValue) {
                let handle = this.value;
                // we cannot use this.callParent in instantiations
                let valid = Proxmox.form.KVComboBox.prototype.validator.call(this, renderedValue);

                if (!valid || !handle) {
                    return false;
                }

                const info = me.repoInfo.find((elem) => elem.handle === handle);
                if (!info) {
                    return false;
                }

                if (info.status) {
                    return Ext.String.format(gettext('{0} is already configured'), renderedValue);
                }
                return valid;
            },
            listeners: {
                change: function (f, value) {
                    const info = me.repoInfo.find((elem) => elem.handle === value);
                    description.setValue(info.description);
                    status.setValue(info.status);
                },
            },
        });

        repoSelector.setValue(me.repoInfo[0].handle);

        Ext.apply(me, {
            items: [repoSelector, description, status],
            repoSelector: repoSelector,
        });

        me.callParent();
    },
});

Ext.define('Proxmox.node.APTRepositoriesErrors', {
    extend: 'Ext.grid.GridPanel',

    xtype: 'proxmoxNodeAPTRepositoriesErrors',

    store: {},

    scrollable: true,

    viewConfig: {
        stripeRows: false,
        getRowClass: (record) => {
            switch (record.data.status) {
                case 'warning':
                    return 'proxmox-warning-row';
                case 'critical':
                    return 'proxmox-invalid-row';
                default:
                    return '';
            }
        },
    },

    hideHeaders: true,

    columns: [
        {
            dataIndex: 'status',
            renderer: (value) =>
                `<i class="fa fa-fw ${Proxmox.Utils.get_health_icon(value, true)}"></i>`,
            width: 50,
        },
        {
            dataIndex: 'message',
            flex: 1,
        },
    ],
});

Ext.define('Proxmox.node.APTRepositoriesGrid', {
    extend: 'Ext.grid.GridPanel',
    xtype: 'proxmoxNodeAPTRepositoriesGrid',
    mixins: ['Proxmox.Mixin.CBind'],

    title: gettext('APT Repositories'),

    cls: 'proxmox-apt-repos', // to allow applying styling to general components with local effect

    border: false,

    tbar: [
        {
            text: gettext('Reload'),
            iconCls: 'fa fa-refresh',
            handler: function () {
                let me = this;
                me.up('proxmoxNodeAPTRepositories').reload();
            },
        },
        {
            text: gettext('Add'),
            name: 'addRepo',
            disabled: true,
            repoInfo: undefined,
            cbind: {
                onlineHelp: '{onlineHelp}',
            },
            handler: function (button, event, record) {
                Proxmox.Utils.checked_command(() => {
                    let me = this;
                    let panel = me.up('proxmoxNodeAPTRepositories');

                    let extraParams = {};
                    if (panel.digest !== undefined) {
                        extraParams.digest = panel.digest;
                    }

                    Ext.create('Proxmox.window.APTRepositoryAdd', {
                        repoInfo: me.repoInfo,
                        url: `/api2/extjs/nodes/${panel.nodename}/apt/repositories`,
                        method: 'PUT',
                        extraRequestParams: extraParams,
                        onlineHelp: me.onlineHelp,
                        listeners: {
                            destroy: function () {
                                panel.reload();
                            },
                        },
                    }).show();
                });
            },
        },
        '-',
        {
            xtype: 'proxmoxAltTextButton',
            defaultText: gettext('Enable'),
            altText: gettext('Disable'),
            name: 'repoEnable',
            disabled: true,
            bind: {
                text: '{enableButtonText}',
            },
            handler: function (button, event, record) {
                let me = this;
                let panel = me.up('proxmoxNodeAPTRepositories');

                let params = {
                    path: record.data.Path,
                    index: record.data.Index,
                    enabled: record.data.Enabled ? 0 : 1, // invert
                };

                if (panel.digest !== undefined) {
                    params.digest = panel.digest;
                }

                Proxmox.Utils.API2Request({
                    url: `/nodes/${panel.nodename}/apt/repositories`,
                    method: 'POST',
                    params: params,
                    failure: function (response, opts) {
                        Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                        panel.reload();
                    },
                    success: function (response, opts) {
                        panel.reload();
                    },
                });
            },
        },
    ],

    sortableColumns: false,
    viewConfig: {
        stripeRows: false,
        getRowClass: (record, index) => (record.get('Enabled') ? '' : 'proxmox-disabled-row'),
    },

    columns: [
        {
            header: gettext('Enabled'),
            dataIndex: 'Enabled',
            align: 'center',
            renderer: Proxmox.Utils.renderEnabledIcon,
            width: 90,
        },
        {
            header: gettext('Types'),
            dataIndex: 'Types',
            renderer: function (types, cell, record) {
                return types.join(' ');
            },
            width: 100,
        },
        {
            header: gettext('URIs'),
            dataIndex: 'URIs',
            renderer: function (uris, cell, record) {
                return uris.join(' ');
            },
            width: 350,
        },
        {
            header: gettext('Suites'),
            dataIndex: 'Suites',
            renderer: function (suites, metaData, record) {
                let err = '';
                if (record.data.warnings && record.data.warnings.length > 0) {
                    let txt = [ngettext('Warning', 'Warnings', 1)];
                    record.data.warnings.forEach((warning) => {
                        if (warning.property === 'Suites') {
                            txt.push(Ext.htmlEncode(warning.message));
                        }
                    });
                    metaData.tdAttr = `data-qtip="${Ext.htmlEncode(txt.join('<br>'))}"`;
                    if (record.data.Enabled) {
                        metaData.tdCls = 'proxmox-invalid-row';
                        err = '<i class="fa fa-fw critical fa-exclamation-circle"></i> ';
                    } else {
                        metaData.tdCls = 'proxmox-warning-row';
                        err = '<i class="fa fa-fw warning fa-exclamation-circle"></i> ';
                    }
                }
                return suites.join(' ') + err;
            },
            width: 130,
        },
        {
            header: gettext('Components'),
            dataIndex: 'Components',
            renderer: function (components, metaData, record) {
                if (components === undefined) {
                    return '';
                }
                let err = '';
                if (components.length === 1) {
                    // FIXME: this should be a flag set to the actual repsotiories, i.e., a tristate
                    // like production-ready = <yes|no|other> (Option<bool>)
                    if (components[0].match(/\w+(-no-subscription|test)\s*$/i)) {
                        metaData.tdCls = 'proxmox-warning-row';
                        err = '<i class="fa fa-fw warning fa-exclamation-circle"></i> ';

                        let qtip = components[0].match(/no-subscription/)
                            ? gettext('The no-subscription repository is NOT production-ready')
                            : gettext('The test repository may contain unstable updates');
                        metaData.tdAttr = `data-qtip="${Ext.htmlEncode(Ext.htmlEncode(qtip))}"`;
                    }
                }
                return components.join(' ') + err;
            },
            width: 170,
        },
        {
            header: gettext('Options'),
            dataIndex: 'Options',
            renderer: function (options, cell, record) {
                if (!options) {
                    return '';
                }

                let filetype = record.data.FileType;
                let text = '';

                options.forEach(function (option) {
                    let key = option.Key;
                    if (filetype === 'list') {
                        let values = option.Values.join(',');
                        text += `${key}=${values} `;
                    } else if (filetype === 'sources') {
                        let values = option.Values.join(' ');
                        text += `${key}: ${values}<br>`;
                    } else {
                        throw 'unknown file type';
                    }
                });
                return text;
            },
            flex: 1,
        },
        {
            header: gettext('Origin'),
            dataIndex: 'Origin',
            width: 120,
            renderer: function (value, meta, rec) {
                if (typeof value !== 'string' || value.length === 0) {
                    value = gettext('Other');
                }
                let cls = 'fa fa-fw fa-question-circle-o';
                let originType = this.up('proxmoxNodeAPTRepositories').classifyOrigin(value);
                if (originType === 'Proxmox') {
                    cls = 'pmx-itype-icon pmx-itype-icon-proxmox-x';
                } else if (originType === 'Debian') {
                    cls = 'pmx-itype-icon pmx-itype-icon-debian-swirl';
                }
                return `<i class='${cls}'></i> ${value}`;
            },
        },
        {
            header: gettext('Comment'),
            dataIndex: 'Comment',
            flex: 2,
            renderer: Ext.String.htmlEncode,
        },
    ],

    features: [
        {
            ftype: 'grouping',
            groupHeaderTpl:
                '{[ "File: " + values.name ]} ({rows.length} repositor{[values.rows.length > 1 ? "ies" : "y"]})',
            enableGroupingMenu: false,
        },
    ],

    store: {
        model: 'apt-repolist',
        groupField: 'Path',
        sorters: [
            {
                property: 'Index',
                direction: 'ASC',
            },
        ],
    },

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            throw 'no node name specified';
        }

        me.callParent();
    },
});

Ext.define('Proxmox.node.APTRepositories', {
    extend: 'Ext.panel.Panel',
    xtype: 'proxmoxNodeAPTRepositories',
    mixins: ['Proxmox.Mixin.CBind'],

    digest: undefined,

    onlineHelp: undefined,

    product: 'Proxmox VE', // default

    classifyOrigin: function (origin) {
        origin ||= '';
        if (origin.match(/^\s*Proxmox\s*$/i)) {
            return 'Proxmox';
        } else if (origin.match(/^\s*Debian\s*(:?Backports)?$/i)) {
            return 'Debian';
        }
        return 'Other';
    },

    controller: {
        xclass: 'Ext.app.ViewController',

        selectionChange: function (grid, selection) {
            let me = this;
            if (!selection || selection.length < 1) {
                return;
            }
            let rec = selection[0];
            let vm = me.getViewModel();
            vm.set('selectionenabled', rec.get('Enabled'));
            vm.notify();
        },

        updateState: function () {
            let me = this;
            let vm = me.getViewModel();

            let store = vm.get('errorstore');
            store.removeAll();

            let status = 'good'; // start with best, the helper below will downgrade if needed
            let text = gettext('All OK, you have production-ready repositories configured!');

            let addGood = (message) => store.add({ status: 'good', message });
            let addWarn = (message, important) => {
                if (status !== 'critical') {
                    status = 'warning';
                    text = important ? message : ngettext('Warning', 'Warnings', 1);
                }
                store.add({ status: 'warning', message });
            };
            let addCritical = (message, important) => {
                status = 'critical';
                text = important ? message : gettext('Error');
                store.add({ status: 'critical', message });
            };

            let errors = vm.get('errors');
            errors.forEach((error) => addCritical(`${error.path} - ${error.error}`));

            let activeSubscription = vm.get('subscriptionActive');
            let enterprise = vm.get('enterpriseRepo');
            let nosubscription = vm.get('noSubscriptionRepo');
            let test = vm.get('testRepo');
            let cephRepos = {
                enterprise: vm.get('cephEnterpriseRepo'),
                nosubscription: vm.get('cephNoSubscriptionRepo'),
                test: vm.get('cephTestRepo'),
            };
            let wrongSuites = vm.get('suitesWarning');
            let mixedSuites = vm.get('mixedSuites');

            if (!enterprise && !nosubscription && !test) {
                addCritical(
                    Ext.String.format(
                        gettext('No {0} repository is enabled, you do not get any updates!'),
                        vm.get('product'),
                    ),
                );
            } else if (errors.length > 0) {
                // nothing extra, just avoid that we show "get updates"
            } else if (enterprise && !nosubscription && !test && activeSubscription) {
                addGood(
                    Ext.String.format(
                        gettext('You get supported updates for {0}'),
                        vm.get('product'),
                    ),
                );
            } else if (nosubscription || test) {
                addGood(Ext.String.format(gettext('You get updates for {0}'), vm.get('product')));
            }

            if (wrongSuites) {
                addWarn(gettext('Some suites are misconfigured'));
            }

            if (mixedSuites) {
                addWarn(gettext('Detected mixed suites before upgrade'));
            }

            let productionReadyCheck = (repos, type, noSubAlternateName) => {
                if (!activeSubscription && repos.enterprise) {
                    addWarn(
                        Ext.String.format(
                            gettext(
                                'The {0}enterprise repository is enabled, but there is no active subscription!',
                            ),
                            type,
                        ),
                    );
                }

                if (repos.nosubscription) {
                    addWarn(
                        Ext.String.format(
                            gettext(
                                'The {0}no-subscription{1} repository is not recommended for production use!',
                            ),
                            type,
                            noSubAlternateName,
                        ),
                    );
                }

                if (repos.test) {
                    addWarn(
                        Ext.String.format(
                            gettext(
                                'The {0}test repository may pull in unstable updates and is not recommended for production use!',
                            ),
                            type,
                        ),
                    );
                }
            };

            productionReadyCheck({ enterprise, nosubscription, test }, '', '');
            // TODO drop alternate 'main' name when no longer relevant
            productionReadyCheck(cephRepos, 'Ceph ', '/main');

            if (errors.length > 0) {
                text = gettext('Fatal parsing error for at least one repository');
            }

            let iconCls = Proxmox.Utils.get_health_icon(status, true);

            vm.set('state', {
                iconCls,
                text,
            });
        },
    },

    viewModel: {
        data: {
            product: 'Proxmox VE', // default
            errors: [],
            suitesWarning: false,
            mixedSuites: false, // used before major upgrade
            subscriptionActive: '',
            noSubscriptionRepo: '',
            enterpriseRepo: '',
            testRepo: '',
            cephEnterpriseRepo: '',
            cephNoSubscriptionRepo: '',
            cephTestRepo: '',
            selectionenabled: false,
            state: {},
        },
        formulas: {
            enableButtonText: (get) =>
                get('selectionenabled') ? gettext('Disable') : gettext('Enable'),
        },
        stores: {
            errorstore: {
                fields: ['status', 'message'],
            },
        },
    },

    scrollable: true,
    layout: {
        type: 'vbox',
        align: 'stretch',
    },

    items: [
        {
            xtype: 'panel',
            border: false,
            layout: {
                type: 'hbox',
                align: 'stretch',
            },
            height: 200,
            title: gettext('Status'),
            items: [
                {
                    xtype: 'box',
                    flex: 2,
                    margin: 10,
                    data: {
                        iconCls: Proxmox.Utils.get_health_icon(undefined, true),
                        text: '',
                    },
                    bind: {
                        data: '{state}',
                    },
                    tpl: [
                        '<center class="centered-flex-column" style="font-size:15px;line-height: 25px;">',
                        '<i class="fa fa-4x {iconCls}"></i>',
                        '{text}',
                        '</center>',
                    ],
                },
                {
                    xtype: 'proxmoxNodeAPTRepositoriesErrors',
                    name: 'repositoriesErrors',
                    flex: 7,
                    margin: 10,
                    bind: {
                        store: '{errorstore}',
                    },
                },
            ],
        },
        {
            xtype: 'proxmoxNodeAPTRepositoriesGrid',
            name: 'repositoriesGrid',
            flex: 1,
            cbind: {
                nodename: '{nodename}',
                onlineHelp: '{onlineHelp}',
            },
            majorUpgradeAllowed: false, // TODO get release information from an API call?
            listeners: {
                selectionchange: 'selectionChange',
            },
        },
    ],

    check_subscription: function () {
        let me = this;
        let vm = me.getViewModel();

        Proxmox.Utils.API2Request({
            url: `/nodes/${me.nodename}/subscription`,
            method: 'GET',
            failure: (response, opts) => Ext.Msg.alert(gettext('Error'), response.htmlStatus),
            success: function (response, opts) {
                const res = response.result;
                const subscription = !(
                    !res ||
                    !res.data ||
                    res.data.status.toLowerCase() !== 'active'
                );
                vm.set('subscriptionActive', subscription);
                me.getController().updateState();
            },
        });
    },

    updateStandardRepos: function (standardRepos) {
        let me = this;
        let vm = me.getViewModel();

        let addButton = me.down('button[name=addRepo]');

        addButton.repoInfo = [];
        for (const standardRepo of standardRepos) {
            const handle = standardRepo.handle;
            const status = standardRepo.status;

            if (handle === 'enterprise') {
                vm.set('enterpriseRepo', status);
            } else if (handle === 'no-subscription') {
                vm.set('noSubscriptionRepo', status);
            } else if (handle === 'test') {
                vm.set('testRepo', status);
            } else if (handle.match(/^ceph-[a-zA-Z]+-enterprise$/)) {
                vm.set('cephEnterpriseRepo', status);
            } else if (handle.match(/^ceph-[a-zA-Z]+-no-subscription$/)) {
                vm.set('cephNoSubscriptionRepo', status);
            } else if (handle.match(/^ceph-[a-zA-Z]+-test$/)) {
                vm.set('cephTestRepo', status);
            }
            me.getController().updateState();

            addButton.repoInfo.push(standardRepo);
            addButton.digest = me.digest;
        }

        addButton.setDisabled(false);
    },

    reload: function () {
        let me = this;
        let vm = me.getViewModel();
        let repoGrid = me.down('proxmoxNodeAPTRepositoriesGrid');

        me.store.load(function (records, operation, success) {
            let gridData = [];
            let errors = [];
            let digest;
            let suitesWarning = false;

            // Usually different suites will give errors anyways, but before a major upgrade the
            // current and the next suite are allowed, so it makes sense to check for mixed suites.
            let checkMixedSuites = false;
            let mixedSuites = false;

            if (success && records.length > 0) {
                let data = records[0].data;
                let files = data.files;
                errors = data.errors;
                digest = data.digest;

                let infos = {};
                for (const info of data.infos) {
                    let path = info.path;
                    let idx = info.index;

                    if (!infos[path]) {
                        infos[path] = {};
                    }
                    if (!infos[path][idx]) {
                        infos[path][idx] = {
                            origin: '',
                            warnings: [],
                            // Used as a heuristic to detect mixed repositories pre-upgrade. The
                            // warning is set on all repositories that do configure the next suite.
                            gotIgnorePreUpgradeWarning: false,
                        };
                    }

                    if (info.kind === 'origin') {
                        infos[path][idx].origin = info.message;
                    } else if (info.kind === 'warning') {
                        infos[path][idx].warnings.push(info);
                    } else if (info.kind === 'ignore-pre-upgrade-warning') {
                        infos[path][idx].gotIgnorePreUpgradeWarning = true;
                        if (!repoGrid.majorUpgradeAllowed) {
                            infos[path][idx].warnings.push(info);
                        } else {
                            checkMixedSuites = true;
                        }
                    }
                }

                files.forEach(function (file) {
                    for (let n = 0; n < file.repositories.length; n++) {
                        let repo = file.repositories[n];
                        repo.Path = file.path;
                        repo.Index = n;
                        if (infos[file.path] && infos[file.path][n]) {
                            repo.Origin = infos[file.path][n].origin || Proxmox.Utils.unknownText;
                            repo.warnings = infos[file.path][n].warnings || [];

                            if (repo.Enabled) {
                                if (repo.warnings.some((w) => w.property === 'Suites')) {
                                    suitesWarning = true;
                                }

                                let originType = me.classifyOrigin(repo.Origin);
                                // Only Proxmox and Debian repositories checked here, because the
                                // warning can be missing for others for a different reason (e.g.
                                // using 'stable' or non-Debian code names).
                                if (
                                    checkMixedSuites &&
                                    repo.Types.includes('deb') &&
                                    (originType === 'Proxmox' || originType === 'Debian') &&
                                    !infos[file.path][n].gotIgnorePreUpgradeWarning
                                ) {
                                    mixedSuites = true;
                                }
                            }
                        }
                        gridData.push(repo);
                    }
                });

                repoGrid.store.loadData(gridData);

                me.updateStandardRepos(data['standard-repos']);
            }

            me.digest = digest;

            vm.set('errors', errors);
            vm.set('suitesWarning', suitesWarning);
            vm.set('mixedSuites', mixedSuites);
            me.getController().updateState();
        });

        me.check_subscription();
    },

    listeners: {
        activate: function () {
            let me = this;
            me.reload();
        },
    },

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            throw 'no node name specified';
        }

        let store = Ext.create('Ext.data.Store', {
            proxy: {
                type: 'proxmox',
                url: `/api2/json/nodes/${me.nodename}/apt/repositories`,
            },
        });

        Ext.apply(me, { store: store });

        Proxmox.Utils.monStoreErrors(me, me.store, true);

        me.callParent();

        me.getViewModel().set('product', me.product);
    },
});
Ext.define('Proxmox.node.NetworkEdit', {
    extend: 'Proxmox.window.Edit',
    alias: ['widget.proxmoxNodeNetworkEdit'],

    // Enable to show the VLAN ID field
    enableBridgeVlanIds: false,

    // Show alternative names below normal name
    showAltNames: false,

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            throw 'no node name specified';
        }

        if (!me.iftype) {
            throw 'no network device type specified';
        }

        me.isCreate = !me.iface;

        let iface_vtype;

        if (me.iftype === 'bridge') {
            iface_vtype = 'BridgeName';
        } else if (me.iftype === 'bond') {
            iface_vtype = 'BondName';
        } else if (me.iftype === 'eth' && !me.isCreate) {
            iface_vtype = 'InterfaceName';
        } else if (me.iftype === 'vlan') {
            iface_vtype = 'VlanName';
        } else if (me.iftype === 'OVSBridge') {
            iface_vtype = 'BridgeName';
        } else if (me.iftype === 'OVSBond') {
            iface_vtype = 'BondName';
        } else if (me.iftype === 'OVSIntPort') {
            iface_vtype = 'InterfaceName';
        } else if (me.iftype === 'OVSPort') {
            iface_vtype = 'InterfaceName';
        } else {
            console.log(me.iftype);
            throw 'unknown network device type specified';
        }

        me.subject = Proxmox.Utils.render_network_iface_type(me.iftype);

        let column1 = [],
            column2 = [],
            columnB = [],
            advancedColumn1 = [],
            advancedColumn2 = [];

        if (!(me.iftype === 'OVSIntPort' || me.iftype === 'OVSPort' || me.iftype === 'OVSBond')) {
            column2.push({
                xtype: 'proxmoxcheckbox',
                fieldLabel: gettext('Autostart'),
                name: 'autostart',
                uncheckedValue: 0,
                checked: me.isCreate ? true : undefined,
            });
        }

        if (me.iftype === 'bridge') {
            let vlanIdsField = !me.enableBridgeVlanIds
                ? undefined
                : Ext.create('Ext.form.field.Text', {
                      fieldLabel: gettext('VLAN IDs'),
                      name: 'bridge_vids',
                      emptyText: '2-4094',
                      disabled: true,
                      autoEl: {
                          tag: 'div',
                          'data-qtip': gettext(
                              "List of VLAN IDs and ranges, useful for NICs with restricted VLAN offloading support. For example: '2 4 100-200'",
                          ),
                      },
                      validator: function (value) {
                          if (!value) {
                              // empty
                              return true;
                          }

                          for (const vid of value.split(/\s+[,;]?/)) {
                              if (!vid) {
                                  continue;
                              }
                              let res = vid.match(/^(\d+)(?:-(\d+))?$/);
                              if (!res) {
                                  return Ext.String.format(
                                      gettext('not a valid bridge VLAN ID entry: {0}'),
                                      vid,
                                  );
                              }
                              let start = Number(res[1]),
                                  end = Number(res[2] ?? res[1]); // end=start for single IDs

                              if (Number.isNaN(start) || Number.isNaN(end)) {
                                  return Ext.String.format(
                                      gettext('VID range includes not-a-number: {0}'),
                                      vid,
                                  );
                              } else if (start > end) {
                                  return Ext.String.format(
                                      gettext('VID range must go from lower to higher tag: {0}'),
                                      vid,
                                  );
                              } else if (start < 2 || end > 4094) {
                                  // check just one each, we already ensured start < end
                                  return Ext.String.format(
                                      gettext('VID range outside of allowed 2 and 4094 limit: {0}'),
                                      vid,
                                  );
                              }
                          }
                          return true;
                      },
                  });
            column2.push({
                xtype: 'proxmoxcheckbox',
                fieldLabel: gettext('VLAN aware'),
                name: 'bridge_vlan_aware',
                deleteEmpty: !me.isCreate,
                listeners: {
                    change: function (f, newVal) {
                        if (vlanIdsField) {
                            vlanIdsField.setDisabled(!newVal);
                        }
                    },
                },
            });
            column2.push({
                xtype: 'textfield',
                fieldLabel: gettext('Bridge ports'),
                name: 'bridge_ports',
                autoEl: {
                    tag: 'div',
                    'data-qtip': gettext(
                        'Space-separated list of interfaces, for example: enp0s0 enp1s0',
                    ),
                },
            });
            if (vlanIdsField) {
                advancedColumn2.push(vlanIdsField);
            }
        } else if (me.iftype === 'OVSBridge') {
            column2.push({
                xtype: 'textfield',
                fieldLabel: gettext('Bridge ports'),
                name: 'ovs_ports',
                autoEl: {
                    tag: 'div',
                    'data-qtip': gettext(
                        'Space-separated list of interfaces, for example: enp0s0 enp1s0',
                    ),
                },
            });
            column2.push({
                xtype: 'textfield',
                fieldLabel: gettext('OVS options'),
                name: 'ovs_options',
            });
        } else if (me.iftype === 'OVSPort' || me.iftype === 'OVSIntPort') {
            column2.push({
                xtype: me.isCreate ? 'PVE.form.BridgeSelector' : 'displayfield',
                fieldLabel: Proxmox.Utils.render_network_iface_type('OVSBridge'),
                allowBlank: false,
                nodename: me.nodename,
                bridgeType: 'OVSBridge',
                name: 'ovs_bridge',
            });
            column2.push({
                xtype: 'proxmoxvlanfield',
                deleteEmpty: !me.isCreate,
                name: 'ovs_tag',
                value: '',
            });
            column2.push({
                xtype: 'textfield',
                fieldLabel: gettext('OVS options'),
                name: 'ovs_options',
            });
        } else if (me.iftype === 'vlan') {
            if (!me.isCreate) {
                me.disablevlanid = false;
                me.disablevlanrawdevice = false;
                me.vlanrawdevicevalue = '';
                me.vlanidvalue = '';

                if (Proxmox.Utils.VlanInterface_match.test(me.iface)) {
                    me.disablevlanid = true;
                    me.disablevlanrawdevice = true;
                    let arr = Proxmox.Utils.VlanInterface_match.exec(me.iface);
                    me.vlanrawdevicevalue = arr[1];
                    me.vlanidvalue = arr[2];
                } else if (Proxmox.Utils.Vlan_match.test(me.iface)) {
                    me.disablevlanid = true;
                    let arr = Proxmox.Utils.Vlan_match.exec(me.iface);
                    me.vlanidvalue = arr[1];
                }
            } else {
                me.disablevlanid = true;
                me.disablevlanrawdevice = true;
            }

            column2.push({
                xtype: 'textfield',
                fieldLabel: gettext('Vlan raw device'),
                name: 'vlan-raw-device',
                value: me.vlanrawdevicevalue,
                disabled: me.disablevlanrawdevice,
                allowBlank: false,
            });

            column2.push({
                xtype: 'proxmoxvlanfield',
                name: 'vlan-id',
                value: me.vlanidvalue,
                disabled: me.disablevlanid,
            });

            columnB.push({
                xtype: 'label',
                userCls: 'pmx-hint',
                text: 'Either add the VLAN number to an existing interface name, or choose your own name and set the VLAN raw device (for the latter ifupdown1 supports vlanXY naming only)',
            });
        } else if (me.iftype === 'bond') {
            column2.push({
                xtype: 'textfield',
                fieldLabel: gettext('Slaves'),
                name: 'slaves',
            });

            let policySelector = Ext.createWidget('bondPolicySelector', {
                fieldLabel: gettext('Hash policy'),
                name: 'bond_xmit_hash_policy',
                deleteEmpty: !me.isCreate,
                disabled: true,
            });

            let primaryfield = Ext.createWidget('textfield', {
                fieldLabel: 'bond-primary',
                name: 'bond-primary',
                value: '',
                disabled: true,
            });

            column2.push({
                xtype: 'bondModeSelector',
                fieldLabel: gettext('Mode'),
                name: 'bond_mode',
                value: me.isCreate ? 'balance-rr' : undefined,
                listeners: {
                    change: function (f, value) {
                        if (value === 'balance-xor' || value === '802.3ad') {
                            policySelector.setDisabled(false);
                            primaryfield.setDisabled(true);
                            primaryfield.setValue('');
                        } else if (value === 'active-backup') {
                            primaryfield.setDisabled(false);
                            policySelector.setDisabled(true);
                            policySelector.setValue('');
                        } else {
                            policySelector.setDisabled(true);
                            policySelector.setValue('');
                            primaryfield.setDisabled(true);
                            primaryfield.setValue('');
                        }
                    },
                },
                allowBlank: false,
            });

            column2.push(policySelector);
            column2.push(primaryfield);
        } else if (me.iftype === 'OVSBond') {
            column2.push({
                xtype: me.isCreate ? 'PVE.form.BridgeSelector' : 'displayfield',
                fieldLabel: Proxmox.Utils.render_network_iface_type('OVSBridge'),
                allowBlank: false,
                nodename: me.nodename,
                bridgeType: 'OVSBridge',
                name: 'ovs_bridge',
            });
            column2.push({
                xtype: 'proxmoxvlanfield',
                deleteEmpty: !me.isCreate,
                name: 'ovs_tag',
                value: '',
            });
            column2.push({
                xtype: 'textfield',
                fieldLabel: gettext('OVS options'),
                name: 'ovs_options',
            });
        }

        column2.push({
            xtype: 'textfield',
            fieldLabel: gettext('Comment'),
            allowBlank: true,
            nodename: me.nodename,
            name: 'comments',
        });

        let url;
        let method;

        if (me.isCreate) {
            url = '/api2/extjs/nodes/' + me.nodename + '/network';
            method = 'POST';
        } else {
            url = '/api2/extjs/nodes/' + me.nodename + '/network/' + me.iface;
            method = 'PUT';
        }

        column1.push(
            {
                xtype: 'hiddenfield',
                name: 'type',
                value: me.iftype,
            },
            {
                xtype: me.isCreate ? 'textfield' : 'displayfield',
                fieldLabel: gettext('Name'),
                name: 'iface',
                value: me.iface,
                vtype: iface_vtype,
                allowBlank: false,
                maxLength: iface_vtype === 'BridgeName' ? 10 : 15,
                autoEl: {
                    tag: 'div',
                    'data-qtip': gettext('For example, vmbr0.100, vmbr0, vlan0.100, vlan0'),
                },
                listeners: {
                    change: function (f, value) {
                        if (me.isCreate && iface_vtype === 'VlanName') {
                            let vlanidField = me.down('field[name=vlan-id]');
                            let vlanrawdeviceField = me.down('field[name=vlan-raw-device]');
                            if (Proxmox.Utils.VlanInterface_match.test(value)) {
                                vlanidField.setDisabled(true);
                                vlanrawdeviceField.setDisabled(true);
                                // User defined those values in the `iface` (Name)
                                // field. Match them (instead of leaving the
                                // previous value) to make clear what is submitted
                                // and how the fields `iface`, `vlan-id` and
                                // `vlan-raw-device` are connected
                                vlanidField.setValue(
                                    value.match(Proxmox.Utils.VlanInterface_match)[2],
                                );
                                vlanrawdeviceField.setValue(
                                    value.match(Proxmox.Utils.VlanInterface_match)[1],
                                );
                            } else if (Proxmox.Utils.Vlan_match.test(value)) {
                                vlanidField.setDisabled(true);
                                vlanidField.setValue(value.match(Proxmox.Utils.Vlan_match)[1]);
                                vlanrawdeviceField.setDisabled(false);
                            } else {
                                vlanidField.setDisabled(false);
                                vlanrawdeviceField.setDisabled(false);
                            }
                        }
                    },
                },
            },
        );

        if (me.showAltNames && !me.isCreate) {
            column1.push({
                xtype: 'displayfield',
                name: 'altnames',
                fieldLabel: gettext("Alternative Names"),
            });
        }

        if (me.iftype === 'OVSBond') {
            column1.push(
                {
                    xtype: 'bondModeSelector',
                    fieldLabel: gettext('Mode'),
                    name: 'bond_mode',
                    openvswitch: true,
                    value: me.isCreate ? 'active-backup' : undefined,
                    allowBlank: false,
                },
                {
                    xtype: 'textfield',
                    fieldLabel: gettext('Slaves'),
                    name: 'ovs_bonds',
                },
            );
        } else {
            column1.push(
                {
                    xtype: 'proxmoxtextfield',
                    deleteEmpty: !me.isCreate,
                    fieldLabel: 'IPv4/CIDR',
                    vtype: 'IPCIDRAddress',
                    name: 'cidr',
                },
                {
                    xtype: 'proxmoxtextfield',
                    deleteEmpty: !me.isCreate,
                    fieldLabel: gettext('Gateway') + ' (IPv4)',
                    vtype: 'IPAddress',
                    name: 'gateway',
                },
                {
                    xtype: 'proxmoxtextfield',
                    deleteEmpty: !me.isCreate,
                    fieldLabel: 'IPv6/CIDR',
                    vtype: 'IP6CIDRAddress',
                    name: 'cidr6',
                },
                {
                    xtype: 'proxmoxtextfield',
                    deleteEmpty: !me.isCreate,
                    fieldLabel: gettext('Gateway') + ' (IPv6)',
                    vtype: 'IP6Address',
                    name: 'gateway6',
                },
            );
        }
        advancedColumn1.push({
            xtype: 'proxmoxintegerfield',
            minValue: 1280,
            maxValue: 65520,
            deleteEmpty: !me.isCreate,
            emptyText: 1500,
            fieldLabel: 'MTU',
            name: 'mtu',
        });

        Ext.applyIf(me, {
            url: url,
            method: method,
            items: {
                xtype: 'inputpanel',
                column1: column1,
                column2: column2,
                columnB: columnB,
                advancedColumn1: advancedColumn1,
                advancedColumn2: advancedColumn2,
            },
        });

        me.callParent();

        if (me.isCreate) {
            me.down('field[name=iface]').setValue(me.iface_default);
        } else {
            me.load({
                success: function (response, options) {
                    let data = response.result.data;
                    if (data.type !== me.iftype) {
                        let msg = 'Got unexpected device type';
                        Ext.Msg.alert(gettext('Error'), msg, function () {
                            me.close();
                        });
                        return;
                    }

                    if (data.altnames) {
                        if (Ext.isArray(data.altnames)) {
                            data.altnames = data.altnames.join('<br>');
                        }
                    } else if (me.showAltNames && !me.isCreate) {
                        me.down('field[name=altnames]').setVisible(false);
                    }
                    me.setValues(data);
                    me.isValid(); // trigger validation
                },
            });
        }
    },
});
Ext.define('proxmox-networks', {
    extend: 'Ext.data.Model',
    fields: [
        'active',
        'address',
        'address6',
        'altnames',
        'autostart',
        'bridge_ports',
        'cidr',
        'cidr6',
        'comments',
        'gateway',
        'gateway6',
        'iface',
        'netmask',
        'netmask6',
        'slaves',
        'type',
        'vlan-id',
        'vlan-raw-device',
    ],
    idProperty: 'iface',
});

Ext.define('Proxmox.node.NetworkView', {
    extend: 'Ext.panel.Panel',

    alias: ['widget.proxmoxNodeNetworkView'],

    // defines what types of network devices we want to create
    // order is always the same
    types: ['bridge', 'bond', 'vlan', 'ovs'],

    showApplyBtn: false,

    // if true, the altnames column will be shown by default
    showAltNames: false,

    // for options passed down to the network edit window
    editOptions: {},

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            throw 'no node name specified';
        }

        let baseUrl = `/nodes/${me.nodename}/network`;

        let store = Ext.create('Ext.data.Store', {
            model: 'proxmox-networks',
            proxy: {
                type: 'proxmox',
                url: '/api2/json' + baseUrl,
            },
            sorters: [
                {
                    property: 'iface',
                    direction: 'ASC',
                },
            ],
        });

        let reload = function () {
            let changeitem = me.down('#changes');
            let apply_btn = me.down('#apply');
            let revert_btn = me.down('#revert');
            Proxmox.Utils.API2Request({
                url: baseUrl,
                failure: function (response, opts) {
                    store.loadData({});
                    Proxmox.Utils.setErrorMask(me, response.htmlStatus);
                    changeitem.update('');
                    changeitem.setHidden(true);
                },
                success: function (response, opts) {
                    let result = Ext.decode(response.responseText);
                    store.loadData(result.data);
                    let changes = result.changes;
                    if (changes === undefined || changes === '') {
                        changes = gettext('No changes');
                        changeitem.setHidden(true);
                        apply_btn.setDisabled(true);
                        revert_btn.setDisabled(true);
                    } else {
                        changeitem.update('<pre>' + Ext.htmlEncode(changes) + '</pre>');
                        changeitem.setHidden(false);
                        apply_btn.setDisabled(false);
                        revert_btn.setDisabled(false);
                    }
                },
            });
        };

        let run_editor = function () {
            let grid = me.down('gridpanel');
            let sm = grid.getSelectionModel();
            let rec = sm.getSelection()[0];
            if (!rec) {
                return;
            }

            Ext.create('Proxmox.node.NetworkEdit', {
                autoShow: true,
                nodename: me.nodename,
                iface: rec.data.iface,
                iftype: rec.data.type,
                showAltNames: me.showAltNames,
                ...me.editOptions,
                listeners: {
                    destroy: () => reload(),
                },
            });
        };

        let edit_btn = new Ext.Button({
            text: gettext('Edit'),
            disabled: true,
            handler: run_editor,
        });

        let sm = Ext.create('Ext.selection.RowModel', {});

        let del_btn = new Proxmox.button.StdRemoveButton({
            selModel: sm,
            getUrl: ({ data }) => `${baseUrl}/${data.iface}`,
            callback: () => reload(),
        });

        let apply_btn = Ext.create('Proxmox.button.Button', {
            text: gettext('Apply Configuration'),
            itemId: 'apply',
            disabled: true,
            confirmMsg: 'Do you want to apply pending network changes?',
            hidden: !me.showApplyBtn,
            handler: function () {
                Proxmox.Utils.API2Request({
                    url: baseUrl,
                    method: 'PUT',
                    waitMsgTarget: me,
                    success: function ({ result }, opts) {
                        Ext.create('Proxmox.window.TaskProgress', {
                            autoShow: true,
                            taskDone: reload,
                            upid: result.data,
                        });
                    },
                    failure: (response) => Ext.Msg.alert(gettext('Error'), response.htmlStatus),
                });
            },
        });

        let set_button_status = function () {
            let rec = sm.getSelection()[0];

            edit_btn.setDisabled(!rec);
            del_btn.setDisabled(!rec);
        };

        let findNextFreeInterfaceId = function (prefix) {
            for (let next = 0; next <= 9999; next++) {
                let id = `${prefix}${next.toString()}`;
                if (!store.getById(id)) {
                    return id;
                }
            }
            Ext.Msg.alert('Error', `No free ID for ${prefix} found!`);
            return '';
        };

        let menu_items = [];
        let addEditWindowToMenu = (iType, iDefault) => {
            menu_items.push({
                text: Proxmox.Utils.render_network_iface_type(iType),
                handler: () =>
                    Ext.create('Proxmox.node.NetworkEdit', {
                        autoShow: true,
                        nodename: me.nodename,
                        iftype: iType,
                        iface_default: findNextFreeInterfaceId(iDefault ?? iType),
                        ...me.editOptions,
                        onlineHelp: 'sysadmin_network_configuration',
                        listeners: {
                            destroy: () => reload(),
                        },
                    }),
            });
        };

        if (me.types.indexOf('bridge') !== -1) {
            addEditWindowToMenu('bridge', 'vmbr');
        }

        if (me.types.indexOf('bond') !== -1) {
            addEditWindowToMenu('bond');
        }

        if (me.types.indexOf('vlan') !== -1) {
            addEditWindowToMenu('vlan');
        }

        if (me.types.indexOf('ovs') !== -1) {
            if (menu_items.length > 0) {
                menu_items.push({ xtype: 'menuseparator' });
            }

            addEditWindowToMenu('OVSBridge', 'vmbr');
            addEditWindowToMenu('OVSBond', 'bond');

            menu_items.push({
                text: Proxmox.Utils.render_network_iface_type('OVSIntPort'),
                handler: () =>
                    Ext.create('Proxmox.node.NetworkEdit', {
                        autoShow: true,
                        nodename: me.nodename,
                        iftype: 'OVSIntPort',
                        listeners: {
                            destroy: () => reload(),
                        },
                    }),
            });
        }

        let renderer_generator = function (fieldname) {
            return function (val, metaData, rec) {
                let tmp = [];
                if (rec.data[fieldname]) {
                    tmp.push(rec.data[fieldname]);
                }
                if (rec.data[fieldname + '6']) {
                    tmp.push(rec.data[fieldname + '6']);
                }
                return tmp.join('<br>') || '';
            };
        };

        Ext.apply(me, {
            layout: 'border',
            tbar: [
                {
                    text: gettext('Create'),
                    menu: {
                        plain: true,
                        items: menu_items,
                    },
                },
                '-',
                {
                    text: gettext('Revert'),
                    itemId: 'revert',
                    handler: function () {
                        Proxmox.Utils.API2Request({
                            url: baseUrl,
                            method: 'DELETE',
                            waitMsgTarget: me,
                            callback: function () {
                                reload();
                            },
                            failure: (response) =>
                                Ext.Msg.alert(gettext('Error'), response.htmlStatus),
                        });
                    },
                },
                edit_btn,
                del_btn,
                '-',
                apply_btn,
            ],
            items: [
                {
                    xtype: 'gridpanel',
                    stateful: true,
                    stateId: 'grid-node-network',
                    store: store,
                    selModel: sm,
                    region: 'center',
                    border: false,
                    columns: [
                        {
                            header: gettext('Name'),
                            sortable: true,
                            dataIndex: 'iface',
                        },
                        {
                            header: gettext("Alternative Names"),
                            dataIndex: 'altnames',
                            hidden: !me.showAltNames,
                            width: 140, // enough space for 'enx<MAC>'
                            renderer: (value) => {
                                if (!value) {
                                    return '';
                                }
                                if (Ext.isArray(value)) {
                                    return value.map(Ext.htmlEncode).join('<br>');
                                }
                                return Ext.htmlEncode(value);
                            },
                        },
                        {
                            header: gettext('Type'),
                            sortable: true,
                            width: 120,
                            renderer: Proxmox.Utils.render_network_iface_type,
                            dataIndex: 'type',
                        },
                        {
                            xtype: 'booleancolumn',
                            header: gettext('Active'),
                            width: 80,
                            sortable: true,
                            dataIndex: 'active',
                            trueText: Proxmox.Utils.yesText,
                            falseText: Proxmox.Utils.noText,
                            undefinedText: Proxmox.Utils.noText,
                        },
                        {
                            xtype: 'booleancolumn',
                            header: gettext('Autostart'),
                            width: 80,
                            sortable: true,
                            dataIndex: 'autostart',
                            trueText: Proxmox.Utils.yesText,
                            falseText: Proxmox.Utils.noText,
                            undefinedText: Proxmox.Utils.noText,
                        },
                        {
                            xtype: 'booleancolumn',
                            header: gettext('VLAN aware'),
                            width: 80,
                            sortable: true,
                            dataIndex: 'bridge_vlan_aware',
                            trueText: Proxmox.Utils.yesText,
                            falseText: Proxmox.Utils.noText,
                            undefinedText: Proxmox.Utils.noText,
                        },
                        {
                            header: gettext('Ports/Slaves'),
                            dataIndex: 'type',
                            renderer: (value, metaData, { data }) => {
                                if (value === 'bridge') {
                                    return data.bridge_ports;
                                } else if (value === 'bond') {
                                    return data.slaves;
                                } else if (value === 'OVSBridge') {
                                    return data.ovs_ports;
                                } else if (value === 'OVSBond') {
                                    return data.ovs_bonds;
                                }
                                return '';
                            },
                        },
                        {
                            header: gettext('Bond Mode'),
                            dataIndex: 'bond_mode',
                            renderer: Proxmox.Utils.render_bond_mode,
                        },
                        {
                            header: gettext('Hash Policy'),
                            hidden: true,
                            dataIndex: 'bond_xmit_hash_policy',
                        },
                        {
                            header: gettext('IP address'),
                            sortable: true,
                            width: 120,
                            hidden: true,
                            dataIndex: 'address',
                            renderer: renderer_generator('address'),
                        },
                        {
                            header: gettext('Subnet mask'),
                            width: 120,
                            sortable: true,
                            hidden: true,
                            dataIndex: 'netmask',
                            renderer: renderer_generator('netmask'),
                        },
                        {
                            header: gettext('CIDR'),
                            width: 150,
                            sortable: true,
                            dataIndex: 'cidr',
                            renderer: renderer_generator('cidr'),
                        },
                        {
                            header: gettext('Gateway'),
                            width: 150,
                            sortable: true,
                            dataIndex: 'gateway',
                            renderer: renderer_generator('gateway'),
                        },
                        {
                            header: gettext('VLAN ID'),
                            hidden: true,
                            sortable: true,
                            dataIndex: 'vlan-id',
                        },
                        {
                            header: gettext('VLAN raw device'),
                            hidden: true,
                            sortable: true,
                            dataIndex: 'vlan-raw-device',
                        },
                        {
                            header: 'MTU',
                            hidden: true,
                            sortable: true,
                            dataIndex: 'mtu',
                        },
                        {
                            header: gettext('Comment'),
                            dataIndex: 'comments',
                            flex: 1,
                            renderer: Ext.String.htmlEncode,
                        },
                    ],
                    listeners: {
                        selectionchange: set_button_status,
                        itemdblclick: run_editor,
                    },
                },
                {
                    border: false,
                    region: 'south',
                    autoScroll: true,
                    hidden: true,
                    itemId: 'changes',
                    tbar: [
                        gettext('Pending changes') +
                            ' (' +
                            gettext(
                                "Either reboot or use 'Apply Configuration' (needs ifupdown2) to activate",
                            ) +
                            ')',
                    ],
                    split: true,
                    bodyPadding: 5,
                    flex: 0.6,
                    html: gettext('No changes'),
                },
            ],
        });

        me.callParent();
        reload();
    },
});
Ext.define('Proxmox.node.DNSEdit', {
    extend: 'Proxmox.window.Edit',
    alias: ['widget.proxmoxNodeDNSEdit'],

    // Some longer existing APIs use a brittle "replace whole config" style, you can set this option
    // if the DNSEdit component is used in an API that has more modern, granular update semantics.
    deleteEmpty: false,

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            throw 'no node name specified';
        }

        me.items = [
            {
                xtype: 'textfield',
                fieldLabel: gettext('Search domain'),
                name: 'search',
                allowBlank: false,
            },
            {
                xtype: 'proxmoxtextfield',
                fieldLabel: gettext('DNS server') + ' 1',
                vtype: 'IP64Address',
                skipEmptyText: true,
                deleteEmpty: me.deleteEmpty,
                name: 'dns1',
            },
            {
                xtype: 'proxmoxtextfield',
                fieldLabel: gettext('DNS server') + ' 2',
                vtype: 'IP64Address',
                skipEmptyText: true,
                deleteEmpty: me.deleteEmpty,
                name: 'dns2',
            },
            {
                xtype: 'proxmoxtextfield',
                fieldLabel: gettext('DNS server') + ' 3',
                vtype: 'IP64Address',
                skipEmptyText: true,
                deleteEmpty: me.deleteEmpty,
                name: 'dns3',
            },
        ];

        Ext.applyIf(me, {
            subject: gettext('DNS'),
            url: '/api2/extjs/nodes/' + me.nodename + '/dns',
            fieldDefaults: {
                labelWidth: 120,
            },
        });

        me.callParent();

        me.load();
    },
});
Ext.define('Proxmox.node.HostsView', {
    extend: 'Ext.panel.Panel',
    xtype: 'proxmoxNodeHostsView',

    reload: function () {
        let me = this;
        me.store.load();
    },

    tbar: [
        {
            text: gettext('Save'),
            disabled: true,
            itemId: 'savebtn',
            handler: function () {
                let view = this.up('panel');
                Proxmox.Utils.API2Request({
                    params: {
                        digest: view.digest,
                        data: view.down('#hostsfield').getValue(),
                    },
                    method: 'POST',
                    url: '/nodes/' + view.nodename + '/hosts',
                    waitMsgTarget: view,
                    success: function (response, opts) {
                        view.reload();
                    },
                    failure: function (response, opts) {
                        Ext.Msg.alert('Error', response.htmlStatus);
                    },
                });
            },
        },
        {
            text: gettext('Revert'),
            disabled: true,
            itemId: 'resetbtn',
            handler: function () {
                let view = this.up('panel');
                view.down('#hostsfield').reset();
            },
        },
    ],

    layout: 'fit',

    items: [
        {
            xtype: 'textarea',
            itemId: 'hostsfield',
            fieldStyle: {
                'font-family': 'monospace',
                'white-space': 'pre',
            },
            listeners: {
                dirtychange: function (ta, dirty) {
                    let view = this.up('panel');
                    view.down('#savebtn').setDisabled(!dirty);
                    view.down('#resetbtn').setDisabled(!dirty);
                },
            },
        },
    ],

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            throw 'no node name specified';
        }

        me.store = Ext.create('Ext.data.Store', {
            proxy: {
                type: 'proxmox',
                url: '/api2/json/nodes/' + me.nodename + '/hosts',
            },
        });

        me.callParent();

        Proxmox.Utils.monStoreErrors(me, me.store);

        me.mon(me.store, 'load', function (store, records, success) {
            if (!success || records.length < 1) {
                return;
            }
            me.digest = records[0].data.digest;
            let data = records[0].data.data;
            me.down('#hostsfield').setValue(data);
            me.down('#hostsfield').resetOriginalValue();
        });

        me.reload();
    },
});
Ext.define('Proxmox.node.DNSView', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.proxmoxNodeDNSView'],

    // Some longer existing APIs use a brittle "replace whole config" style, you can set this option
    // if the DNSView component is used in an API that has more modern, granular update semantics.
    deleteEmpty: false,

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            throw 'no node name specified';
        }

        let run_editor = () =>
            Ext.create('Proxmox.node.DNSEdit', {
                autoShow: true,
                nodename: me.nodename,
                deleteEmpty: me.deleteEmpty,
            });

        Ext.apply(me, {
            url: `/api2/json/nodes/${me.nodename}/dns`,
            cwidth1: 130,
            interval: 10 * 1000,
            run_editor: run_editor,
            rows: {
                search: {
                    header: gettext('Search domain'),
                    required: true,
                    renderer: Ext.htmlEncode,
                },
                dns1: {
                    header: gettext('DNS server') + ' 1',
                    required: true,
                    renderer: Ext.htmlEncode,
                },
                dns2: {
                    header: gettext('DNS server') + ' 2',
                    renderer: Ext.htmlEncode,
                },
                dns3: {
                    header: gettext('DNS server') + ' 3',
                    renderer: Ext.htmlEncode,
                },
            },
            tbar: [
                {
                    text: gettext('Edit'),
                    handler: run_editor,
                },
            ],
            listeners: {
                itemdblclick: run_editor,
            },
        });

        me.callParent();

        me.on('activate', me.rstore.startUpdate);
        me.on('deactivate', me.rstore.stopUpdate);
        me.on('destroy', me.rstore.stopUpdate);
    },
});
Ext.define('Proxmox.node.Tasks', {
    extend: 'Ext.grid.GridPanel',

    alias: 'widget.proxmoxNodeTasks',

    stateful: true,
    stateId: 'pve-grid-node-tasks',

    loadMask: true,
    sortableColumns: false,

    // set extra filter components, must have a 'name' property for the parameter, and must
    // trigger a 'change' event if the value is 'undefined', it will not be sent to the api
    extraFilter: [],

    // fixed filters which cannot be changed after instantiation, for example:
    // { vmid: 100 }
    preFilter: {},

    controller: {
        xclass: 'Ext.app.ViewController',

        showTaskLog: function () {
            let me = this;
            let selection = me.getView().getSelection();
            if (selection.length < 1) {
                return;
            }

            let rec = selection[0];

            Ext.create('Proxmox.window.TaskViewer', {
                upid: rec.data.upid,
                endtime: rec.data.endtime,
            }).show();
        },

        updateLayout: function (store, records, success, operation) {
            let me = this;
            let view = me.getView().getView(); // the table view, not the whole grid
            Proxmox.Utils.setErrorMask(view, false);
            // update the scrollbar on every store load since the total count might be different.
            // the buffered grid plugin does this only on (user) scrolling itself and even reduces
            // the scrollheight again when scrolling up
            me.getView().updateLayout();

            if (!success) {
                Proxmox.Utils.setErrorMask(
                    view,
                    Proxmox.Utils.getResponseErrorMessage(operation.getError()),
                );
            }
        },

        refresh: function () {
            let me = this;
            let view = me.getView();

            let selection = view.getSelection();
            let store = me.getViewModel().get('bufferedstore');
            if (selection && selection.length > 0) {
                // deselect if selection is not there anymore
                if (!store.contains(selection[0])) {
                    view.setSelection(undefined);
                }
            }
        },

        sinceChange: function (field, newval) {
            let me = this;
            let vm = me.getViewModel();

            vm.set('since', newval);
        },

        untilChange: function (field, newval, oldval) {
            let me = this;
            let vm = me.getViewModel();

            vm.set('until', newval);
        },

        reload: function () {
            let me = this;
            let view = me.getView();
            view.getStore().load();
        },

        showFilter: function (btn, pressed) {
            let me = this;
            let vm = me.getViewModel();
            vm.set('showFilter', pressed);
        },

        clearFilter: function () {
            let me = this;
            me.lookup('filtertoolbar')
                .query('field')
                .forEach((field) => {
                    field.setValue(undefined);
                });
        },
    },

    listeners: {
        itemdblclick: 'showTaskLog',
    },

    viewModel: {
        data: {
            typefilter: '',
            statusfilter: '',
            showFilter: false,
            extraFilter: {},
            since: null,
            until: null,
        },

        formulas: {
            filterIcon: (get) => 'fa fa-filter' + (get('showFilter') ? ' info-blue' : ''),
            extraParams: function (get) {
                let me = this;
                let params = {};
                if (get('typefilter')) {
                    params.typefilter = get('typefilter');
                }
                if (get('statusfilter')) {
                    params.statusfilter = get('statusfilter');
                }

                if (get('extraFilter')) {
                    let extraFilter = get('extraFilter');
                    for (const [name, value] of Object.entries(extraFilter)) {
                        if (value !== undefined && value !== null && value !== '') {
                            params[name] = value;
                        }
                    }
                }

                if (get('since')) {
                    params.since = get('since').valueOf() / 1000;
                }

                if (get('until')) {
                    let until = new Date(get('until').getTime()); // copy object
                    until.setDate(until.getDate() + 1); // end of the day
                    params.until = until.valueOf() / 1000;
                }

                me.getView().getStore().load();

                return params;
            },
            filterCount: function (get) {
                let count = 0;
                if (get('typefilter')) {
                    count++;
                }
                let status = get('statusfilter');
                if (
                    (Ext.isArray(status) && status.length > 0) ||
                    (!Ext.isArray(status) && status)
                ) {
                    count++;
                }
                if (get('since')) {
                    count++;
                }
                if (get('until')) {
                    count++;
                }

                if (get('extraFilter')) {
                    let preFilter = get('preFilter') || {};
                    let extraFilter = get('extraFilter');
                    for (const [name, value] of Object.entries(extraFilter)) {
                        if (
                            value !== undefined &&
                            value !== null &&
                            value !== '' &&
                            preFilter[name] === undefined
                        ) {
                            count++;
                        }
                    }
                }

                return count;
            },
            clearFilterText: function (get) {
                let count = get('filterCount');
                let fieldMsg = '';
                if (count > 1) {
                    fieldMsg = ` (${count} ${gettext('Fields')})`;
                } else if (count > 0) {
                    fieldMsg = ` (1 ${gettext('Field')})`;
                }
                return gettext('Clear Filter') + fieldMsg;
            },
        },

        stores: {
            bufferedstore: {
                type: 'buffered',
                pageSize: 500,
                autoLoad: true,
                remoteFilter: true,
                model: 'proxmox-tasks',
                proxy: {
                    type: 'proxmox',
                    startParam: 'start',
                    limitParam: 'limit',
                    extraParams: '{extraParams}',
                    url: '{url}',
                },
                listeners: {
                    prefetch: 'updateLayout',
                    refresh: 'refresh',
                },
            },
        },
    },

    bind: {
        store: '{bufferedstore}',
    },

    dockedItems: [
        {
            xtype: 'toolbar',
            items: [
                {
                    xtype: 'proxmoxButton',
                    text: gettext('View Task'),
                    iconCls: 'fa fa-window-restore',
                    disabled: true,
                    handler: 'showTaskLog',
                },
                {
                    xtype: 'button',
                    text: gettext('Reload'),
                    iconCls: 'fa fa-refresh',
                    handler: 'reload',
                },
                '->',
                {
                    xtype: 'button',
                    bind: {
                        text: '{clearFilterText}',
                        disabled: '{!filterCount}',
                    },
                    text: gettext('Clear Filter'),
                    enabled: false,
                    handler: 'clearFilter',
                },
                {
                    xtype: 'button',
                    enableToggle: true,
                    bind: {
                        iconCls: '{filterIcon}',
                    },
                    text: gettext('Filter'),
                    stateful: true,
                    stateId: 'task-showfilter',
                    stateEvents: ['toggle'],
                    applyState: function (state) {
                        if (state.pressed !== undefined) {
                            this.setPressed(state.pressed);
                        }
                    },
                    getState: function () {
                        return {
                            pressed: this.pressed,
                        };
                    },
                    listeners: {
                        toggle: 'showFilter',
                    },
                },
            ],
        },
        {
            xtype: 'toolbar',
            dock: 'top',
            reference: 'filtertoolbar',
            layout: {
                type: 'hbox',
                align: 'top',
            },
            bind: {
                hidden: '{!showFilter}',
            },
            items: [
                {
                    xtype: 'container',
                    padding: 10,
                    layout: {
                        type: 'vbox',
                        align: 'stretch',
                    },
                    defaults: {
                        labelWidth: 80,
                    },
                    // cannot bind the values directly, as it then changes also
                    // on blur, causing wrong reloads of the store
                    items: [
                        {
                            xtype: 'datefield',
                            fieldLabel: gettext('Since'),
                            format: 'Y-m-d',
                            bind: {
                                maxValue: '{until}',
                            },
                            listeners: {
                                change: 'sinceChange',
                            },
                        },
                        {
                            xtype: 'datefield',
                            fieldLabel: gettext('Until'),
                            format: 'Y-m-d',
                            bind: {
                                minValue: '{since}',
                            },
                            listeners: {
                                change: 'untilChange',
                            },
                        },
                    ],
                },
                {
                    xtype: 'container',
                    padding: 10,
                    layout: {
                        type: 'vbox',
                        align: 'stretch',
                    },
                    defaults: {
                        labelWidth: 80,
                    },
                    items: [
                        {
                            xtype: 'pmxTaskTypeSelector',
                            fieldLabel: gettext('Task Type'),
                            emptyText: gettext('All'),
                            bind: {
                                value: '{typefilter}',
                            },
                        },
                        {
                            xtype: 'combobox',
                            fieldLabel: gettext('Task Result'),
                            emptyText: gettext('All'),
                            multiSelect: true,
                            store: [
                                ['ok', gettext('OK')],
                                ['unknown', Proxmox.Utils.unknownText],
                                ['warning', ngettext('Warning', 'Warnings', 1)], // TODO: use count
                                ['error', gettext('Errors')],
                            ],
                            bind: {
                                value: '{statusfilter}',
                            },
                        },
                    ],
                },
            ],
        },
    ],

    viewConfig: {
        trackOver: false,
        stripeRows: false, // does not work with getRowClass()
        emptyText: gettext('No Tasks found'),

        getRowClass: function (record, index) {
            let status = record.get('status');

            if (status) {
                let parsed = Proxmox.Utils.parse_task_status(status);
                if (parsed === 'error') {
                    return 'proxmox-invalid-row';
                } else if (parsed === 'warning') {
                    return 'proxmox-warning-row';
                }
            }
            return '';
        },
    },

    columns: [
        {
            header: gettext('Start Time'),
            dataIndex: 'starttime',
            width: 130,
            renderer: function (value) {
                return Ext.Date.format(value, 'M d H:i:s');
            },
        },
        {
            header: gettext('End Time'),
            dataIndex: 'endtime',
            width: 130,
            renderer: function (value, metaData, record) {
                if (!value) {
                    metaData.tdCls = 'x-grid-row-loading';
                    return '';
                }
                return Ext.Date.format(value, 'M d H:i:s');
            },
        },
        {
            header: gettext('Duration'),
            hidden: true,
            width: 80,
            renderer: function (value, metaData, record) {
                let start = record.data.starttime;
                if (start) {
                    let end = record.data.endtime || Date.now();
                    let duration = end - start;
                    if (duration > 0) {
                        duration /= 1000;
                    }
                    return Proxmox.Utils.format_duration_human(duration);
                }
                return Proxmox.Utils.unknownText;
            },
        },
        {
            header: gettext('User name'),
            dataIndex: 'user',
            width: 150,
        },
        {
            header: gettext('Description'),
            dataIndex: 'upid',
            flex: 1,
            renderer: Proxmox.Utils.render_upid,
        },
        {
            header: gettext('Status'),
            dataIndex: 'status',
            width: 200,
            renderer: function (value, metaData, record) {
                if (value === undefined && !record.data.endtime) {
                    metaData.tdCls = 'x-grid-row-loading';
                    return '';
                }

                return Proxmox.Utils.format_task_status(value);
            },
        },
        {
            xtype: 'actioncolumn',
            width: 30,
            align: 'center',
            tooltip: gettext('Actions'),
            items: [
                {
                    iconCls: 'fa fa-chevron-right',
                    tooltip: gettext('View Task'),
                    handler: function (_grid, _rowIndex, _colIndex, _item, _e, rec) {
                        Ext.create('Proxmox.window.TaskViewer', {
                            autoShow: true,
                            upid: rec.data.upid,
                            endtime: rec.data.endtime,
                        });
                    },
                },
            ],
        },
    ],

    initComponent: function () {
        const me = this;

        let nodename = me.nodename || 'localhost';
        let url = me.url || `/api2/json/nodes/${nodename}/tasks`;
        me.getViewModel().set('url', url);

        let updateExtraFilters = function (name, value) {
            let vm = me.getViewModel();
            let extraFilter = Ext.clone(vm.get('extraFilter'));
            extraFilter[name] = value;
            vm.set('extraFilter', extraFilter);
        };

        for (const [name, value] of Object.entries(me.preFilter)) {
            updateExtraFilters(name, value);
        }

        me.getViewModel().set('preFilter', me.preFilter);

        me.callParent();

        let addFields = function (items) {
            me.lookup('filtertoolbar').add({
                xtype: 'container',
                padding: 10,
                layout: {
                    type: 'vbox',
                    align: 'stretch',
                },
                defaults: {
                    labelWidth: 80,
                },
                items,
            });
        };

        // start with a userfilter
        me.extraFilter = [
            {
                xtype: 'textfield',
                fieldLabel: gettext('User name'),
                changeOptions: {
                    buffer: 500,
                },
                name: 'userfilter',
            },
            ...me.extraFilter,
        ];
        let items = [];
        for (const filterTemplate of me.extraFilter) {
            let filter = Ext.clone(filterTemplate);

            filter.listeners = filter.listeners || {};
            filter.listeners.change = Ext.apply(filter.changeOptions || {}, {
                fn: function (field, value) {
                    updateExtraFilters(filter.name, value);
                },
            });

            items.push(filter);
            if (items.length === 2) {
                addFields(items);
                items = [];
            }
        }

        addFields(items);
    },
});
Ext.define('proxmox-services', {
    extend: 'Ext.data.Model',
    fields: ['service', 'name', 'desc', 'state', 'unit-state', 'active-state'],
    idProperty: 'service',
});

Ext.define('Proxmox.node.ServiceView', {
    extend: 'Ext.grid.GridPanel',

    alias: ['widget.proxmoxNodeServiceView'],

    startOnlyServices: {},

    restartCommand: 'restart', // TODO: default to reload once everywhere supported

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            throw 'no node name specified';
        }

        let rstore = Ext.create('Proxmox.data.UpdateStore', {
            interval: 1000,
            model: 'proxmox-services',
            proxy: {
                type: 'proxmox',
                url: `/api2/json/nodes/${me.nodename}/services`,
            },
        });

        let filterInstalledOnly = (record) => record.get('unit-state') !== 'not-found';

        let store = Ext.create('Proxmox.data.DiffStore', {
            rstore: rstore,
            sortAfterUpdate: true,
            sorters: [
                {
                    property: 'name',
                    direction: 'ASC',
                },
            ],
            filters: [filterInstalledOnly],
        });

        let unHideCB = Ext.create('Ext.form.field.Checkbox', {
            boxLabel: gettext('Show only installed services'),
            value: true,
            boxLabelAlign: 'before',
            listeners: {
                change: function (_cb, value) {
                    if (value) {
                        store.addFilter([filterInstalledOnly]);
                    } else {
                        store.clearFilter();
                    }
                },
            },
        });

        let view_service_log = function () {
            let {
                data: { service },
            } = me.getSelectionModel().getSelection()[0];

            let viewSize = Ext.getBody().getViewSize();

            Ext.create('Ext.window.Window', {
                title: gettext('Syslog') + ': ' + service,
                modal: true,
                width: viewSize.width > 1600 ? 1000 : 800,
                height: viewSize.height > 900 ? 800 : 600,
                layout: 'fit',
                items: {
                    xtype: 'proxmoxLogView',
                    url: `/api2/extjs/nodes/${me.nodename}/syslog?service=${service}`,
                    log_select_timespan: 1,
                },
                autoShow: true,
            });
        };

        let service_cmd = function (cmd) {
            let {
                data: { service },
            } = me.getSelectionModel().getSelection()[0];
            Proxmox.Utils.API2Request({
                url: `/nodes/${me.nodename}/services/${service}/${cmd}`,
                method: 'POST',
                failure: function (response, opts) {
                    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
                    me.loading = true;
                },
                success: function (response, opts) {
                    rstore.startUpdate();
                    Ext.create('Proxmox.window.TaskProgress', {
                        upid: response.result.data,
                        autoShow: true,
                    });
                },
            });
        };

        let start_btn = new Ext.Button({
            text: gettext('Start'),
            disabled: true,
            handler: () => service_cmd('start'),
        });
        let stop_btn = new Ext.Button({
            text: gettext('Stop'),
            disabled: true,
            handler: () => service_cmd('stop'),
        });
        let restart_btn = new Ext.Button({
            text: gettext('Restart'),
            disabled: true,
            handler: () => service_cmd(me.restartCommand || 'restart'),
        });
        let syslog_btn = new Ext.Button({
            text: gettext('Service System Log'),
            disabled: true,
            handler: view_service_log,
        });

        let set_button_status = function () {
            let sm = me.getSelectionModel();
            let rec = sm.getSelection()[0];

            if (!rec) {
                start_btn.disable();
                stop_btn.disable();
                restart_btn.disable();
                syslog_btn.disable();
                return;
            }
            let service = rec.data.service;
            let state = rec.data.state;
            let unit = rec.data['unit-state'];

            syslog_btn.enable();

            if (state === 'running') {
                if (me.startOnlyServices[service]) {
                    stop_btn.disable();
                    restart_btn.enable();
                } else {
                    stop_btn.enable();
                    restart_btn.enable();
                    start_btn.disable();
                }
            } else if (
                unit !== undefined &&
                (unit === 'masked' || unit === 'unknown' || unit === 'not-found')
            ) {
                start_btn.disable();
                restart_btn.disable();
                stop_btn.disable();
            } else {
                start_btn.enable();
                stop_btn.disable();
                restart_btn.disable();
            }
        };

        me.mon(store, 'refresh', set_button_status);

        Proxmox.Utils.monStoreErrors(me, rstore);

        Ext.apply(me, {
            viewConfig: {
                trackOver: false,
                stripeRows: false, // does not work with getRowClass()
                getRowClass: function (record, index) {
                    let unitState = record.get('unit-state');
                    if (!unitState) {
                        return '';
                    }
                    if (unitState === 'masked' || unitState === 'not-found') {
                        return 'proxmox-disabled-row';
                    } else if (unitState === 'unknown') {
                        if (
                            record.get('name') === 'syslog' || // replaced by journal on most hosts
                            record.get('name') === 'systemd-timesyncd' || // chrony is preferred
                            record.get('name') === 'proxmox-firewall' // opt-in NFT based variant
                        ) {
                            return 'proxmox-disabled-row';
                        }
                        return 'proxmox-warning-row';
                    }
                    return '';
                },
            },
            store: store,
            stateful: false,
            tbar: [start_btn, stop_btn, restart_btn, '-', syslog_btn, '->', unHideCB],
            columns: [
                {
                    header: gettext('Name'),
                    flex: 1,
                    sortable: true,
                    dataIndex: 'name',
                },
                {
                    header: gettext('Status'),
                    width: 100,
                    sortable: true,
                    dataIndex: 'state',
                    renderer: (value, meta, rec) => {
                        const unitState = rec.get('unit-state');
                        if (unitState === 'masked') {
                            return gettext('disabled');
                        } else if (unitState === 'not-found') {
                            return gettext('not installed');
                        } else {
                            return value;
                        }
                    },
                },
                {
                    header: gettext('Active'),
                    width: 100,
                    sortable: true,
                    hidden: true,
                    dataIndex: 'active-state',
                },
                {
                    header: gettext('Unit'),
                    width: 120,
                    sortable: true,
                    hidden: !Ext.Array.contains(
                        ['PVEAuthCookie', 'PBSAuthCookie'],
                        Proxmox?.Setup?.auth_cookie_name,
                    ),
                    dataIndex: 'unit-state',
                },
                {
                    header: gettext('Description'),
                    renderer: Ext.String.htmlEncode,
                    dataIndex: 'desc',
                    flex: 2,
                },
            ],
            listeners: {
                selectionchange: set_button_status,
                itemdblclick: view_service_log,
                activate: rstore.startUpdate,
                destroy: rstore.stopUpdate,
            },
        });

        me.callParent();
    },
});
Ext.define('Proxmox.node.TimeEdit', {
    extend: 'Proxmox.window.Edit',
    alias: ['widget.proxmoxNodeTimeEdit'],

    subject: gettext('Time zone'),

    width: 400,

    autoLoad: true,

    fieldDefaults: {
        labelWidth: 70,
    },

    items: {
        xtype: 'combo',
        fieldLabel: gettext('Time zone'),
        name: 'timezone',
        queryMode: 'local',
        store: Ext.create('Proxmox.data.TimezoneStore'),
        displayField: 'zone',
        editable: true,
        anyMatch: true,
        forceSelection: true,
        allowBlank: false,
    },

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            throw 'no node name specified';
        }
        me.url = '/api2/extjs/nodes/' + me.nodename + '/time';

        me.callParent();
    },
});
Ext.define('Proxmox.node.TimeView', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.proxmoxNodeTimeView'],

    initComponent: function () {
        let me = this;

        if (!me.nodename) {
            throw 'no node name specified';
        }

        let tzOffset = new Date().getTimezoneOffset() * 60000;
        let renderLocaltime = function (value) {
            let servertime = new Date(value * 1000 + tzOffset);
            return Ext.Date.format(servertime, 'Y-m-d H:i:s');
        };

        let run_editor = () =>
            Ext.create('Proxmox.node.TimeEdit', {
                autoShow: true,
                nodename: me.nodename,
            });

        Ext.apply(me, {
            url: `/api2/json/nodes/${me.nodename}/time`,
            cwidth1: 150,
            interval: 1000,
            run_editor: run_editor,
            rows: {
                timezone: {
                    header: gettext('Time zone'),
                    required: true,
                },
                localtime: {
                    header: gettext('Server time'),
                    required: true,
                    renderer: renderLocaltime,
                },
            },
            tbar: [
                {
                    text: gettext('Edit'),
                    handler: run_editor,
                },
            ],
            listeners: {
                itemdblclick: run_editor,
            },
        });

        me.callParent();

        me.on('activate', me.rstore.startUpdate);
        me.on('deactivate', me.rstore.stopUpdate);
        me.on('destroy', me.rstore.stopUpdate);
    },
});
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2025, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 */

/**
 * DO NOT EDIT THIS FILE
 * The code in this file is generated from files in ./src/
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.marked = {}));
})(this, (function (exports) { 'use strict';

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _createForOfIteratorHelperLoose(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (it) return (it = it.call(o)).next.bind(it);
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;
      return function () {
        if (i >= o.length) return {
          done: true
        };
        return {
          done: false,
          value: o[i++]
        };
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }

  function getDefaults() {
    return {
      async: false,
      baseUrl: null,
      breaks: false,
      extensions: null,
      gfm: true,
      headerIds: true,
      headerPrefix: '',
      highlight: null,
      langPrefix: 'language-',
      mangle: true,
      pedantic: false,
      renderer: null,
      sanitize: false,
      sanitizer: null,
      silent: false,
      smartypants: false,
      tokenizer: null,
      walkTokens: null,
      xhtml: false
    };
  }
  exports.defaults = getDefaults();
  function changeDefaults(newDefaults) {
    exports.defaults = newDefaults;
  }

  /**
   * Helpers
   */
  var escapeTest = /[&<>"']/;
  var escapeReplace = new RegExp(escapeTest.source, 'g');
  var escapeTestNoEncode = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/;
  var escapeReplaceNoEncode = new RegExp(escapeTestNoEncode.source, 'g');
  var escapeReplacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  var getEscapeReplacement = function getEscapeReplacement(ch) {
    return escapeReplacements[ch];
  };
  function escape(html, encode) {
    if (encode) {
      if (escapeTest.test(html)) {
        return html.replace(escapeReplace, getEscapeReplacement);
      }
    } else {
      if (escapeTestNoEncode.test(html)) {
        return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
      }
    }
    return html;
  }
  var unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;

  /**
   * @param {string} html
   */
  function unescape(html) {
    // explicitly match decimal, hex, and named HTML entities
    return html.replace(unescapeTest, function (_, n) {
      n = n.toLowerCase();
      if (n === 'colon') return ':';
      if (n.charAt(0) === '#') {
        return n.charAt(1) === 'x' ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
      }
      return '';
    });
  }
  var caret = /(^|[^\[])\^/g;

  /**
   * @param {string | RegExp} regex
   * @param {string} opt
   */
  function edit(regex, opt) {
    regex = typeof regex === 'string' ? regex : regex.source;
    opt = opt || '';
    var obj = {
      replace: function replace(name, val) {
        val = val.source || val;
        val = val.replace(caret, '$1');
        regex = regex.replace(name, val);
        return obj;
      },
      getRegex: function getRegex() {
        return new RegExp(regex, opt);
      }
    };
    return obj;
  }
  var nonWordAndColonTest = /[^\w:]/g;
  var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

  /**
   * @param {boolean} sanitize
   * @param {string} base
   * @param {string} href
   */
  function cleanUrl(sanitize, base, href) {
    if (sanitize) {
      var prot;
      try {
        prot = decodeURIComponent(unescape(href)).replace(nonWordAndColonTest, '').toLowerCase();
      } catch (e) {
        return null;
      }
      if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
        return null;
      }
    }
    if (base && !originIndependentUrl.test(href)) {
      href = resolveUrl(base, href);
    }
    try {
      href = encodeURI(href).replace(/%25/g, '%');
    } catch (e) {
      return null;
    }
    return href;
  }
  var baseUrls = {};
  var justDomain = /^[^:]+:\/*[^/]*$/;
  var protocol = /^([^:]+:)[\s\S]*$/;
  var domain = /^([^:]+:\/*[^/]*)[\s\S]*$/;

  /**
   * @param {string} base
   * @param {string} href
   */
  function resolveUrl(base, href) {
    if (!baseUrls[' ' + base]) {
      // we can ignore everything in base after the last slash of its path component,
      // but we might need to add _that_
      // https://tools.ietf.org/html/rfc3986#section-3
      if (justDomain.test(base)) {
        baseUrls[' ' + base] = base + '/';
      } else {
        baseUrls[' ' + base] = rtrim(base, '/', true);
      }
    }
    base = baseUrls[' ' + base];
    var relativeBase = base.indexOf(':') === -1;
    if (href.substring(0, 2) === '//') {
      if (relativeBase) {
        return href;
      }
      return base.replace(protocol, '$1') + href;
    } else if (href.charAt(0) === '/') {
      if (relativeBase) {
        return href;
      }
      return base.replace(domain, '$1') + href;
    } else {
      return base + href;
    }
  }
  var noopTest = {
    exec: function noopTest() {}
  };
  function merge(obj) {
    var i = 1,
      target,
      key;
    for (; i < arguments.length; i++) {
      target = arguments[i];
      for (key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
          obj[key] = target[key];
        }
      }
    }
    return obj;
  }
  function splitCells(tableRow, count) {
    // ensure that every cell-delimiting pipe has a space
    // before it to distinguish it from an escaped pipe
    var row = tableRow.replace(/\|/g, function (match, offset, str) {
        var escaped = false,
          curr = offset;
        while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
        if (escaped) {
          // odd number of slashes means | is escaped
          // so we leave it alone
          return '|';
        } else {
          // add space before unescaped |
          return ' |';
        }
      }),
      cells = row.split(/ \|/);
    var i = 0;

    // First/last cell in a row cannot be empty if it has no leading/trailing pipe
    if (!cells[0].trim()) {
      cells.shift();
    }
    if (cells.length > 0 && !cells[cells.length - 1].trim()) {
      cells.pop();
    }
    if (cells.length > count) {
      cells.splice(count);
    } else {
      while (cells.length < count) cells.push('');
    }
    for (; i < cells.length; i++) {
      // leading or trailing whitespace is ignored per the gfm spec
      cells[i] = cells[i].trim().replace(/\\\|/g, '|');
    }
    return cells;
  }

  /**
   * Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
   * /c*$/ is vulnerable to REDOS.
   *
   * @param {string} str
   * @param {string} c
   * @param {boolean} invert Remove suffix of non-c chars instead. Default falsey.
   */
  function rtrim(str, c, invert) {
    var l = str.length;
    if (l === 0) {
      return '';
    }

    // Length of suffix matching the invert condition.
    var suffLen = 0;

    // Step left until we fail to match the invert condition.
    while (suffLen < l) {
      var currChar = str.charAt(l - suffLen - 1);
      if (currChar === c && !invert) {
        suffLen++;
      } else if (currChar !== c && invert) {
        suffLen++;
      } else {
        break;
      }
    }
    return str.slice(0, l - suffLen);
  }
  function findClosingBracket(str, b) {
    if (str.indexOf(b[1]) === -1) {
      return -1;
    }
    var l = str.length;
    var level = 0,
      i = 0;
    for (; i < l; i++) {
      if (str[i] === '\\') {
        i++;
      } else if (str[i] === b[0]) {
        level++;
      } else if (str[i] === b[1]) {
        level--;
        if (level < 0) {
          return i;
        }
      }
    }
    return -1;
  }
  function checkSanitizeDeprecation(opt) {
    if (opt && opt.sanitize && !opt.silent) {
      console.warn('marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options');
    }
  }

  // copied from https://stackoverflow.com/a/5450113/806777
  /**
   * @param {string} pattern
   * @param {number} count
   */
  function repeatString(pattern, count) {
    if (count < 1) {
      return '';
    }
    var result = '';
    while (count > 1) {
      if (count & 1) {
        result += pattern;
      }
      count >>= 1;
      pattern += pattern;
    }
    return result + pattern;
  }

  function outputLink(cap, link, raw, lexer) {
    var href = link.href;
    var title = link.title ? escape(link.title) : null;
    var text = cap[1].replace(/\\([\[\]])/g, '$1');
    if (cap[0].charAt(0) !== '!') {
      lexer.state.inLink = true;
      var token = {
        type: 'link',
        raw: raw,
        href: href,
        title: title,
        text: text,
        tokens: lexer.inlineTokens(text)
      };
      lexer.state.inLink = false;
      return token;
    }
    return {
      type: 'image',
      raw: raw,
      href: href,
      title: title,
      text: escape(text)
    };
  }
  function indentCodeCompensation(raw, text) {
    var matchIndentToCode = raw.match(/^(\s+)(?:```)/);
    if (matchIndentToCode === null) {
      return text;
    }
    var indentToCode = matchIndentToCode[1];
    return text.split('\n').map(function (node) {
      var matchIndentInNode = node.match(/^\s+/);
      if (matchIndentInNode === null) {
        return node;
      }
      var indentInNode = matchIndentInNode[0];
      if (indentInNode.length >= indentToCode.length) {
        return node.slice(indentToCode.length);
      }
      return node;
    }).join('\n');
  }

  /**
   * Tokenizer
   */
  var Tokenizer = /*#__PURE__*/function () {
    function Tokenizer(options) {
      this.options = options || exports.defaults;
    }
    var _proto = Tokenizer.prototype;
    _proto.space = function space(src) {
      var cap = this.rules.block.newline.exec(src);
      if (cap && cap[0].length > 0) {
        return {
          type: 'space',
          raw: cap[0]
        };
      }
    };
    _proto.code = function code(src) {
      var cap = this.rules.block.code.exec(src);
      if (cap) {
        var text = cap[0].replace(/^ {1,4}/gm, '');
        return {
          type: 'code',
          raw: cap[0],
          codeBlockStyle: 'indented',
          text: !this.options.pedantic ? rtrim(text, '\n') : text
        };
      }
    };
    _proto.fences = function fences(src) {
      var cap = this.rules.block.fences.exec(src);
      if (cap) {
        var raw = cap[0];
        var text = indentCodeCompensation(raw, cap[3] || '');
        return {
          type: 'code',
          raw: raw,
          lang: cap[2] ? cap[2].trim().replace(this.rules.inline._escapes, '$1') : cap[2],
          text: text
        };
      }
    };
    _proto.heading = function heading(src) {
      var cap = this.rules.block.heading.exec(src);
      if (cap) {
        var text = cap[2].trim();

        // remove trailing #s
        if (/#$/.test(text)) {
          var trimmed = rtrim(text, '#');
          if (this.options.pedantic) {
            text = trimmed.trim();
          } else if (!trimmed || / $/.test(trimmed)) {
            // CommonMark requires space before trailing #s
            text = trimmed.trim();
          }
        }
        return {
          type: 'heading',
          raw: cap[0],
          depth: cap[1].length,
          text: text,
          tokens: this.lexer.inline(text)
        };
      }
    };
    _proto.hr = function hr(src) {
      var cap = this.rules.block.hr.exec(src);
      if (cap) {
        return {
          type: 'hr',
          raw: cap[0]
        };
      }
    };
    _proto.blockquote = function blockquote(src) {
      var cap = this.rules.block.blockquote.exec(src);
      if (cap) {
        var text = cap[0].replace(/^ *>[ \t]?/gm, '');
        return {
          type: 'blockquote',
          raw: cap[0],
          tokens: this.lexer.blockTokens(text, []),
          text: text
        };
      }
    };
    _proto.list = function list(src) {
      var cap = this.rules.block.list.exec(src);
      if (cap) {
        var raw, istask, ischecked, indent, i, blankLine, endsWithBlankLine, line, nextLine, rawLine, itemContents, endEarly;
        var bull = cap[1].trim();
        var isordered = bull.length > 1;
        var list = {
          type: 'list',
          raw: '',
          ordered: isordered,
          start: isordered ? +bull.slice(0, -1) : '',
          loose: false,
          items: []
        };
        bull = isordered ? "\\d{1,9}\\" + bull.slice(-1) : "\\" + bull;
        if (this.options.pedantic) {
          bull = isordered ? bull : '[*+-]';
        }

        // Get next list item
        var itemRegex = new RegExp("^( {0,3}" + bull + ")((?:[\t ][^\\n]*)?(?:\\n|$))");

        // Check if current bullet point can start a new List Item
        while (src) {
          endEarly = false;
          if (!(cap = itemRegex.exec(src))) {
            break;
          }
          if (this.rules.block.hr.test(src)) {
            // End list if bullet was actually HR (possibly move into itemRegex?)
            break;
          }
          raw = cap[0];
          src = src.substring(raw.length);
          line = cap[2].split('\n', 1)[0];
          nextLine = src.split('\n', 1)[0];
          if (this.options.pedantic) {
            indent = 2;
            itemContents = line.trimLeft();
          } else {
            indent = cap[2].search(/[^ ]/); // Find first non-space char
            indent = indent > 4 ? 1 : indent; // Treat indented code blocks (> 4 spaces) as having only 1 indent
            itemContents = line.slice(indent);
            indent += cap[1].length;
          }
          blankLine = false;
          if (!line && /^ *$/.test(nextLine)) {
            // Items begin with at most one blank line
            raw += nextLine + '\n';
            src = src.substring(nextLine.length + 1);
            endEarly = true;
          }
          if (!endEarly) {
            var nextBulletRegex = new RegExp("^ {0," + Math.min(3, indent - 1) + "}(?:[*+-]|\\d{1,9}[.)])((?: [^\\n]*)?(?:\\n|$))");
            var hrRegex = new RegExp("^ {0," + Math.min(3, indent - 1) + "}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)");
            var fencesBeginRegex = new RegExp("^ {0," + Math.min(3, indent - 1) + "}(?:```|~~~)");
            var headingBeginRegex = new RegExp("^ {0," + Math.min(3, indent - 1) + "}#");

            // Check if following lines should be included in List Item
            while (src) {
              rawLine = src.split('\n', 1)[0];
              line = rawLine;

              // Re-align to follow commonmark nesting rules
              if (this.options.pedantic) {
                line = line.replace(/^ {1,4}(?=( {4})*[^ ])/g, '  ');
              }

              // End list item if found code fences
              if (fencesBeginRegex.test(line)) {
                break;
              }

              // End list item if found start of new heading
              if (headingBeginRegex.test(line)) {
                break;
              }

              // End list item if found start of new bullet
              if (nextBulletRegex.test(line)) {
                break;
              }

              // Horizontal rule found
              if (hrRegex.test(src)) {
                break;
              }
              if (line.search(/[^ ]/) >= indent || !line.trim()) {
                // Dedent if possible
                itemContents += '\n' + line.slice(indent);
              } else if (!blankLine) {
                // Until blank line, item doesn't need indentation
                itemContents += '\n' + line;
              } else {
                // Otherwise, improper indentation ends this item
                break;
              }
              if (!blankLine && !line.trim()) {
                // Check if current line is blank
                blankLine = true;
              }
              raw += rawLine + '\n';
              src = src.substring(rawLine.length + 1);
            }
          }
          if (!list.loose) {
            // If the previous item ended with a blank line, the list is loose
            if (endsWithBlankLine) {
              list.loose = true;
            } else if (/\n *\n *$/.test(raw)) {
              endsWithBlankLine = true;
            }
          }

          // Check for task list items
          if (this.options.gfm) {
            istask = /^\[[ xX]\] /.exec(itemContents);
            if (istask) {
              ischecked = istask[0] !== '[ ] ';
              itemContents = itemContents.replace(/^\[[ xX]\] +/, '');
            }
          }
          list.items.push({
            type: 'list_item',
            raw: raw,
            task: !!istask,
            checked: ischecked,
            loose: false,
            text: itemContents
          });
          list.raw += raw;
        }

        // Do not consume newlines at end of final item. Alternatively, make itemRegex *start* with any newlines to simplify/speed up endsWithBlankLine logic
        list.items[list.items.length - 1].raw = raw.trimRight();
        list.items[list.items.length - 1].text = itemContents.trimRight();
        list.raw = list.raw.trimRight();
        var l = list.items.length;

        // Item child tokens handled here at end because we needed to have the final item to trim it first
        for (i = 0; i < l; i++) {
          this.lexer.state.top = false;
          list.items[i].tokens = this.lexer.blockTokens(list.items[i].text, []);
          var spacers = list.items[i].tokens.filter(function (t) {
            return t.type === 'space';
          });
          var hasMultipleLineBreaks = spacers.every(function (t) {
            var chars = t.raw.split('');
            var lineBreaks = 0;
            for (var _iterator = _createForOfIteratorHelperLoose(chars), _step; !(_step = _iterator()).done;) {
              var _char = _step.value;
              if (_char === '\n') {
                lineBreaks += 1;
              }
              if (lineBreaks > 1) {
                return true;
              }
            }
            return false;
          });
          if (!list.loose && spacers.length && hasMultipleLineBreaks) {
            // Having a single line break doesn't mean a list is loose. A single line break is terminating the last list item
            list.loose = true;
            list.items[i].loose = true;
          }
        }
        return list;
      }
    };
    _proto.html = function html(src) {
      var cap = this.rules.block.html.exec(src);
      if (cap) {
        var token = {
          type: 'html',
          raw: cap[0],
          pre: !this.options.sanitizer && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
          text: cap[0]
        };
        if (this.options.sanitize) {
          var text = this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]);
          token.type = 'paragraph';
          token.text = text;
          token.tokens = this.lexer.inline(text);
        }
        return token;
      }
    };
    _proto.def = function def(src) {
      var cap = this.rules.block.def.exec(src);
      if (cap) {
        var tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
        var href = cap[2] ? cap[2].replace(/^<(.*)>$/, '$1').replace(this.rules.inline._escapes, '$1') : '';
        var title = cap[3] ? cap[3].substring(1, cap[3].length - 1).replace(this.rules.inline._escapes, '$1') : cap[3];
        return {
          type: 'def',
          tag: tag,
          raw: cap[0],
          href: href,
          title: title
        };
      }
    };
    _proto.table = function table(src) {
      var cap = this.rules.block.table.exec(src);
      if (cap) {
        var item = {
          type: 'table',
          header: splitCells(cap[1]).map(function (c) {
            return {
              text: c
            };
          }),
          align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
          rows: cap[3] && cap[3].trim() ? cap[3].replace(/\n[ \t]*$/, '').split('\n') : []
        };
        if (item.header.length === item.align.length) {
          item.raw = cap[0];
          var l = item.align.length;
          var i, j, k, row;
          for (i = 0; i < l; i++) {
            if (/^ *-+: *$/.test(item.align[i])) {
              item.align[i] = 'right';
            } else if (/^ *:-+: *$/.test(item.align[i])) {
              item.align[i] = 'center';
            } else if (/^ *:-+ *$/.test(item.align[i])) {
              item.align[i] = 'left';
            } else {
              item.align[i] = null;
            }
          }
          l = item.rows.length;
          for (i = 0; i < l; i++) {
            item.rows[i] = splitCells(item.rows[i], item.header.length).map(function (c) {
              return {
                text: c
              };
            });
          }

          // parse child tokens inside headers and cells

          // header child tokens
          l = item.header.length;
          for (j = 0; j < l; j++) {
            item.header[j].tokens = this.lexer.inline(item.header[j].text);
          }

          // cell child tokens
          l = item.rows.length;
          for (j = 0; j < l; j++) {
            row = item.rows[j];
            for (k = 0; k < row.length; k++) {
              row[k].tokens = this.lexer.inline(row[k].text);
            }
          }
          return item;
        }
      }
    };
    _proto.lheading = function lheading(src) {
      var cap = this.rules.block.lheading.exec(src);
      if (cap) {
        return {
          type: 'heading',
          raw: cap[0],
          depth: cap[2].charAt(0) === '=' ? 1 : 2,
          text: cap[1],
          tokens: this.lexer.inline(cap[1])
        };
      }
    };
    _proto.paragraph = function paragraph(src) {
      var cap = this.rules.block.paragraph.exec(src);
      if (cap) {
        var text = cap[1].charAt(cap[1].length - 1) === '\n' ? cap[1].slice(0, -1) : cap[1];
        return {
          type: 'paragraph',
          raw: cap[0],
          text: text,
          tokens: this.lexer.inline(text)
        };
      }
    };
    _proto.text = function text(src) {
      var cap = this.rules.block.text.exec(src);
      if (cap) {
        return {
          type: 'text',
          raw: cap[0],
          text: cap[0],
          tokens: this.lexer.inline(cap[0])
        };
      }
    };
    _proto.escape = function escape$1(src) {
      var cap = this.rules.inline.escape.exec(src);
      if (cap) {
        return {
          type: 'escape',
          raw: cap[0],
          text: escape(cap[1])
        };
      }
    };
    _proto.tag = function tag(src) {
      var cap = this.rules.inline.tag.exec(src);
      if (cap) {
        if (!this.lexer.state.inLink && /^<a /i.test(cap[0])) {
          this.lexer.state.inLink = true;
        } else if (this.lexer.state.inLink && /^<\/a>/i.test(cap[0])) {
          this.lexer.state.inLink = false;
        }
        if (!this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          this.lexer.state.inRawBlock = true;
        } else if (this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          this.lexer.state.inRawBlock = false;
        }
        return {
          type: this.options.sanitize ? 'text' : 'html',
          raw: cap[0],
          inLink: this.lexer.state.inLink,
          inRawBlock: this.lexer.state.inRawBlock,
          text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]) : cap[0]
        };
      }
    };
    _proto.link = function link(src) {
      var cap = this.rules.inline.link.exec(src);
      if (cap) {
        var trimmedUrl = cap[2].trim();
        if (!this.options.pedantic && /^</.test(trimmedUrl)) {
          // commonmark requires matching angle brackets
          if (!/>$/.test(trimmedUrl)) {
            return;
          }

          // ending angle bracket cannot be escaped
          var rtrimSlash = rtrim(trimmedUrl.slice(0, -1), '\\');
          if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
            return;
          }
        } else {
          // find closing parenthesis
          var lastParenIndex = findClosingBracket(cap[2], '()');
          if (lastParenIndex > -1) {
            var start = cap[0].indexOf('!') === 0 ? 5 : 4;
            var linkLen = start + cap[1].length + lastParenIndex;
            cap[2] = cap[2].substring(0, lastParenIndex);
            cap[0] = cap[0].substring(0, linkLen).trim();
            cap[3] = '';
          }
        }
        var href = cap[2];
        var title = '';
        if (this.options.pedantic) {
          // split pedantic href and title
          var link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);
          if (link) {
            href = link[1];
            title = link[3];
          }
        } else {
          title = cap[3] ? cap[3].slice(1, -1) : '';
        }
        href = href.trim();
        if (/^</.test(href)) {
          if (this.options.pedantic && !/>$/.test(trimmedUrl)) {
            // pedantic allows starting angle bracket without ending angle bracket
            href = href.slice(1);
          } else {
            href = href.slice(1, -1);
          }
        }
        return outputLink(cap, {
          href: href ? href.replace(this.rules.inline._escapes, '$1') : href,
          title: title ? title.replace(this.rules.inline._escapes, '$1') : title
        }, cap[0], this.lexer);
      }
    };
    _proto.reflink = function reflink(src, links) {
      var cap;
      if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
        var link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
        link = links[link.toLowerCase()];
        if (!link) {
          var text = cap[0].charAt(0);
          return {
            type: 'text',
            raw: text,
            text: text
          };
        }
        return outputLink(cap, link, cap[0], this.lexer);
      }
    };
    _proto.emStrong = function emStrong(src, maskedSrc, prevChar) {
      if (prevChar === void 0) {
        prevChar = '';
      }
      var match = this.rules.inline.emStrong.lDelim.exec(src);
      if (!match) return;

      // _ can't be between two alphanumerics. \p{L}\p{N} includes non-english alphabet/numbers as well
      if (match[3] && prevChar.match(/(?:[0-9A-Za-z\xAA\xB2\xB3\xB5\xB9\xBA\xBC-\xBE\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u0660-\u0669\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07C0-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0966-\u096F\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09E6-\u09F1\u09F4-\u09F9\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A66-\u0A6F\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AE6-\u0AEF\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B66-\u0B6F\u0B71-\u0B77\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0BE6-\u0BF2\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C66-\u0C6F\u0C78-\u0C7E\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CE6-\u0CEF\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D58-\u0D61\u0D66-\u0D78\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DE6-\u0DEF\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F20-\u0F33\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F-\u1049\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u1090-\u1099\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1369-\u137C\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A16\u1A20-\u1A54\u1A80-\u1A89\u1A90-\u1A99\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B50-\u1B59\u1B83-\u1BA0\u1BAE-\u1BE5\u1C00-\u1C23\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2070\u2071\u2074-\u2079\u207F-\u2089\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2150-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2CFD\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u3192-\u3195\u31A0-\u31BF\u31F0-\u31FF\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA830-\uA835\uA840-\uA873\uA882-\uA8B3\uA8D0-\uA8D9\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA900-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF-\uA9D9\uA9E0-\uA9E4\uA9E6-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD07-\uDD33\uDD40-\uDD78\uDD8A\uDD8B\uDE80-\uDE9C\uDEA0-\uDED0\uDEE1-\uDEFB\uDF00-\uDF23\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC58-\uDC76\uDC79-\uDC9E\uDCA7-\uDCAF\uDCE0-\uDCF2\uDCF4\uDCF5\uDCFB-\uDD1B\uDD20-\uDD39\uDD80-\uDDB7\uDDBC-\uDDCF\uDDD2-\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE40-\uDE48\uDE60-\uDE7E\uDE80-\uDE9F\uDEC0-\uDEC7\uDEC9-\uDEE4\uDEEB-\uDEEF\uDF00-\uDF35\uDF40-\uDF55\uDF58-\uDF72\uDF78-\uDF91\uDFA9-\uDFAF]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDCFA-\uDD23\uDD30-\uDD39\uDE60-\uDE7E\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF27\uDF30-\uDF45\uDF51-\uDF54\uDF70-\uDF81\uDFB0-\uDFCB\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC52-\uDC6F\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD03-\uDD26\uDD36-\uDD3F\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDD0-\uDDDA\uDDDC\uDDE1-\uDDF4\uDE00-\uDE11\uDE13-\uDE2B\uDE3F\uDE40\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDEF0-\uDEF9\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC50-\uDC59\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE50-\uDE59\uDE80-\uDEAA\uDEB8\uDEC0-\uDEC9\uDF00-\uDF1A\uDF30-\uDF3B\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCF2\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDD50-\uDD59\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC50-\uDC6C\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD50-\uDD59\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDDA0-\uDDA9\uDEE0-\uDEF2\uDF02\uDF04-\uDF10\uDF12-\uDF33\uDF50-\uDF59\uDFB0\uDFC0-\uDFD4]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883\uD885-\uD887][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2F\uDC41-\uDC46]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDE70-\uDEBE\uDEC0-\uDEC9\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF50-\uDF59\uDF5B-\uDF61\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE96\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD32\uDD50-\uDD52\uDD55\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD834[\uDEC0-\uDED3\uDEE0-\uDEF3\uDF60-\uDF78]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD837[\uDF00-\uDF1E\uDF25-\uDF2A]|\uD838[\uDC30-\uDC6D\uDD00-\uDD2C\uDD37-\uDD3D\uDD40-\uDD49\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB\uDEF0-\uDEF9]|\uD839[\uDCD0-\uDCEB\uDCF0-\uDCF9\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDCC7-\uDCCF\uDD00-\uDD43\uDD4B\uDD50-\uDD59]|\uD83B[\uDC71-\uDCAB\uDCAD-\uDCAF\uDCB1-\uDCB4\uDD01-\uDD2D\uDD2F-\uDD3D\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD83C[\uDD00-\uDD0C]|\uD83E[\uDFF0-\uDFF9]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF39\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A\uDF50-\uDFFF]|\uD888[\uDC00-\uDFAF])/)) return;
      var nextChar = match[1] || match[2] || '';
      if (!nextChar || nextChar && (prevChar === '' || this.rules.inline.punctuation.exec(prevChar))) {
        var lLength = match[0].length - 1;
        var rDelim,
          rLength,
          delimTotal = lLength,
          midDelimTotal = 0;
        var endReg = match[0][0] === '*' ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
        endReg.lastIndex = 0;

        // Clip maskedSrc to same section of string as src (move to lexer?)
        maskedSrc = maskedSrc.slice(-1 * src.length + lLength);
        while ((match = endReg.exec(maskedSrc)) != null) {
          rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
          if (!rDelim) continue; // skip single * in __abc*abc__

          rLength = rDelim.length;
          if (match[3] || match[4]) {
            // found another Left Delim
            delimTotal += rLength;
            continue;
          } else if (match[5] || match[6]) {
            // either Left or Right Delim
            if (lLength % 3 && !((lLength + rLength) % 3)) {
              midDelimTotal += rLength;
              continue; // CommonMark Emphasis Rules 9-10
            }
          }

          delimTotal -= rLength;
          if (delimTotal > 0) continue; // Haven't found enough closing delimiters

          // Remove extra characters. *a*** -> *a*
          rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
          var raw = src.slice(0, lLength + match.index + (match[0].length - rDelim.length) + rLength);

          // Create `em` if smallest delimiter has odd char count. *a***
          if (Math.min(lLength, rLength) % 2) {
            var _text = raw.slice(1, -1);
            return {
              type: 'em',
              raw: raw,
              text: _text,
              tokens: this.lexer.inlineTokens(_text)
            };
          }

          // Create 'strong' if smallest delimiter has even char count. **a***
          var text = raw.slice(2, -2);
          return {
            type: 'strong',
            raw: raw,
            text: text,
            tokens: this.lexer.inlineTokens(text)
          };
        }
      }
    };
    _proto.codespan = function codespan(src) {
      var cap = this.rules.inline.code.exec(src);
      if (cap) {
        var text = cap[2].replace(/\n/g, ' ');
        var hasNonSpaceChars = /[^ ]/.test(text);
        var hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
        if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
          text = text.substring(1, text.length - 1);
        }
        text = escape(text, true);
        return {
          type: 'codespan',
          raw: cap[0],
          text: text
        };
      }
    };
    _proto.br = function br(src) {
      var cap = this.rules.inline.br.exec(src);
      if (cap) {
        return {
          type: 'br',
          raw: cap[0]
        };
      }
    };
    _proto.del = function del(src) {
      var cap = this.rules.inline.del.exec(src);
      if (cap) {
        return {
          type: 'del',
          raw: cap[0],
          text: cap[2],
          tokens: this.lexer.inlineTokens(cap[2])
        };
      }
    };
    _proto.autolink = function autolink(src, mangle) {
      var cap = this.rules.inline.autolink.exec(src);
      if (cap) {
        var text, href;
        if (cap[2] === '@') {
          text = escape(this.options.mangle ? mangle(cap[1]) : cap[1]);
          href = 'mailto:' + text;
        } else {
          text = escape(cap[1]);
          href = text;
        }
        return {
          type: 'link',
          raw: cap[0],
          text: text,
          href: href,
          tokens: [{
            type: 'text',
            raw: text,
            text: text
          }]
        };
      }
    };
    _proto.url = function url(src, mangle) {
      var cap;
      if (cap = this.rules.inline.url.exec(src)) {
        var text, href;
        if (cap[2] === '@') {
          text = escape(this.options.mangle ? mangle(cap[0]) : cap[0]);
          href = 'mailto:' + text;
        } else {
          // do extended autolink path validation
          var prevCapZero;
          do {
            prevCapZero = cap[0];
            cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
          } while (prevCapZero !== cap[0]);
          text = escape(cap[0]);
          if (cap[1] === 'www.') {
            href = 'http://' + text;
          } else {
            href = text;
          }
        }
        return {
          type: 'link',
          raw: cap[0],
          text: text,
          href: href,
          tokens: [{
            type: 'text',
            raw: text,
            text: text
          }]
        };
      }
    };
    _proto.inlineText = function inlineText(src, smartypants) {
      var cap = this.rules.inline.text.exec(src);
      if (cap) {
        var text;
        if (this.lexer.state.inRawBlock) {
          text = this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]) : cap[0];
        } else {
          text = escape(this.options.smartypants ? smartypants(cap[0]) : cap[0]);
        }
        return {
          type: 'text',
          raw: cap[0],
          text: text
        };
      }
    };
    return Tokenizer;
  }();

  /**
   * Block-Level Grammar
   */
  var block = {
    newline: /^(?: *(?:\n|$))+/,
    code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
    fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
    hr: /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,
    heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
    blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
    list: /^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/,
    html: '^ {0,3}(?:' // optional indentation
    + '<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
    + '|comment[^\\n]*(\\n+|$)' // (2)
    + '|<\\?[\\s\\S]*?(?:\\?>\\n*|$)' // (3)
    + '|<![A-Z][\\s\\S]*?(?:>\\n*|$)' // (4)
    + '|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)' // (5)
    + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (6)
    + '|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (7) open tag
    + '|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (7) closing tag
    + ')',
    def: /^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/,
    table: noopTest,
    lheading: /^((?:.|\n(?!\n))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    // regex template, placeholders will be replaced according to different paragraph
    // interruption rules of commonmark and the original markdown spec:
    _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
    text: /^[^\n]+/
  };
  block._label = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
  block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
  block.def = edit(block.def).replace('label', block._label).replace('title', block._title).getRegex();
  block.bullet = /(?:[*+-]|\d{1,9}[.)])/;
  block.listItemStart = edit(/^( *)(bull) */).replace('bull', block.bullet).getRegex();
  block.list = edit(block.list).replace(/bull/g, block.bullet).replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))').replace('def', '\\n+(?=' + block.def.source + ')').getRegex();
  block._tag = 'address|article|aside|base|basefont|blockquote|body|caption' + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption' + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe' + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option' + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr' + '|track|ul';
  block._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
  block.html = edit(block.html, 'i').replace('comment', block._comment).replace('tag', block._tag).replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
  block.paragraph = edit(block._paragraph).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
  .replace('|table', '').replace('blockquote', ' {0,3}>').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
  .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)').replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
  .getRegex();
  block.blockquote = edit(block.blockquote).replace('paragraph', block.paragraph).getRegex();

  /**
   * Normal Block Grammar
   */

  block.normal = merge({}, block);

  /**
   * GFM Block Grammar
   */

  block.gfm = merge({}, block.normal, {
    table: '^ *([^\\n ].*\\|.*)\\n' // Header
    + ' {0,3}(?:\\| *)?(:?-+:? *(?:\\| *:?-+:? *)*)(?:\\| *)?' // Align
    + '(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)' // Cells
  });

  block.gfm.table = edit(block.gfm.table).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('blockquote', ' {0,3}>').replace('code', ' {4}[^\\n]').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
  .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)').replace('tag', block._tag) // tables can be interrupted by type (6) html blocks
  .getRegex();
  block.gfm.paragraph = edit(block._paragraph).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
  .replace('table', block.gfm.table) // interrupt paragraphs with table
  .replace('blockquote', ' {0,3}>').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
  .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)').replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
  .getRegex();
  /**
   * Pedantic grammar (original John Gruber's loose markdown specification)
   */

  block.pedantic = merge({}, block.normal, {
    html: edit('^ *(?:comment *(?:\\n|\\s*$)' + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
    + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))').replace('comment', block._comment).replace(/tag/g, '(?!(?:' + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub' + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)' + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b').getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: noopTest,
    // fences not supported
    lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    paragraph: edit(block.normal._paragraph).replace('hr', block.hr).replace('heading', ' *#{1,6} *[^\n]').replace('lheading', block.lheading).replace('blockquote', ' {0,3}>').replace('|fences', '').replace('|list', '').replace('|html', '').getRegex()
  });

  /**
   * Inline-Level Grammar
   */
  var inline = {
    escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
    autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
    url: noopTest,
    tag: '^comment' + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
    + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
    + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
    + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
    + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>',
    // CDATA section
    link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
    reflink: /^!?\[(label)\]\[(ref)\]/,
    nolink: /^!?\[(ref)\](?:\[\])?/,
    reflinkSearch: 'reflink|nolink(?!\\()',
    emStrong: {
      lDelim: /^(?:\*+(?:([punct_])|[^\s*]))|^_+(?:([punct*])|([^\s_]))/,
      //        (1) and (2) can only be a Right Delimiter. (3) and (4) can only be Left.  (5) and (6) can be either Left or Right.
      //          () Skip orphan inside strong                                      () Consume to delim     (1) #***                (2) a***#, a***                             (3) #***a, ***a                 (4) ***#              (5) #***#                 (6) a***a
      rDelimAst: /^(?:[^_*\\]|\\.)*?\_\_(?:[^_*\\]|\\.)*?\*(?:[^_*\\]|\\.)*?(?=\_\_)|(?:[^*\\]|\\.)+(?=[^*])|[punct_](\*+)(?=[\s]|$)|(?:[^punct*_\s\\]|\\.)(\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|(?:[^punct*_\s\\]|\\.)(\*+)(?=[^punct*_\s])/,
      rDelimUnd: /^(?:[^_*\\]|\\.)*?\*\*(?:[^_*\\]|\\.)*?\_(?:[^_*\\]|\\.)*?(?=\*\*)|(?:[^_\\]|\\.)+(?=[^_])|[punct*](\_+)(?=[\s]|$)|(?:[^punct*_\s\\]|\\.)(\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/ // ^- Not allowed for _
    },

    code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
    br: /^( {2,}|\\)\n(?!\s*$)/,
    del: noopTest,
    text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
    punctuation: /^([\spunctuation])/
  };

  // list of punctuation marks from CommonMark spec
  // without * and _ to handle the different emphasis markers * and _
  inline._punctuation = '!"#$%&\'()+\\-.,/:;<=>?@\\[\\]`^{|}~';
  inline.punctuation = edit(inline.punctuation).replace(/punctuation/g, inline._punctuation).getRegex();

  // sequences em should skip over [title](link), `code`, <html>
  inline.blockSkip = /\[[^\]]*?\]\([^\)]*?\)|`[^`]*?`|<[^>]*?>/g;
  // lookbehind is not available on Safari as of version 16
  // inline.escapedEmSt = /(?<=(?:^|[^\\)(?:\\[^])*)\\[*_]/g;
  inline.escapedEmSt = /(?:^|[^\\])(?:\\\\)*\\[*_]/g;
  inline._comment = edit(block._comment).replace('(?:-->|$)', '-->').getRegex();
  inline.emStrong.lDelim = edit(inline.emStrong.lDelim).replace(/punct/g, inline._punctuation).getRegex();
  inline.emStrong.rDelimAst = edit(inline.emStrong.rDelimAst, 'g').replace(/punct/g, inline._punctuation).getRegex();
  inline.emStrong.rDelimUnd = edit(inline.emStrong.rDelimUnd, 'g').replace(/punct/g, inline._punctuation).getRegex();
  inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
  inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
  inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
  inline.autolink = edit(inline.autolink).replace('scheme', inline._scheme).replace('email', inline._email).getRegex();
  inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
  inline.tag = edit(inline.tag).replace('comment', inline._comment).replace('attribute', inline._attribute).getRegex();
  inline._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
  inline._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
  inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
  inline.link = edit(inline.link).replace('label', inline._label).replace('href', inline._href).replace('title', inline._title).getRegex();
  inline.reflink = edit(inline.reflink).replace('label', inline._label).replace('ref', block._label).getRegex();
  inline.nolink = edit(inline.nolink).replace('ref', block._label).getRegex();
  inline.reflinkSearch = edit(inline.reflinkSearch, 'g').replace('reflink', inline.reflink).replace('nolink', inline.nolink).getRegex();

  /**
   * Normal Inline Grammar
   */

  inline.normal = merge({}, inline);

  /**
   * Pedantic Inline Grammar
   */

  inline.pedantic = merge({}, inline.normal, {
    strong: {
      start: /^__|\*\*/,
      middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
      endAst: /\*\*(?!\*)/g,
      endUnd: /__(?!_)/g
    },
    em: {
      start: /^_|\*/,
      middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
      endAst: /\*(?!\*)/g,
      endUnd: /_(?!_)/g
    },
    link: edit(/^!?\[(label)\]\((.*?)\)/).replace('label', inline._label).getRegex(),
    reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace('label', inline._label).getRegex()
  });

  /**
   * GFM Inline Grammar
   */

  inline.gfm = merge({}, inline.normal, {
    escape: edit(inline.escape).replace('])', '~|])').getRegex(),
    _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
    url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
    _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
    text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
  });
  inline.gfm.url = edit(inline.gfm.url, 'i').replace('email', inline.gfm._extended_email).getRegex();
  /**
   * GFM + Line Breaks Inline Grammar
   */

  inline.breaks = merge({}, inline.gfm, {
    br: edit(inline.br).replace('{2,}', '*').getRegex(),
    text: edit(inline.gfm.text).replace('\\b_', '\\b_| {2,}\\n').replace(/\{2,\}/g, '*').getRegex()
  });

  /**
   * smartypants text replacement
   * @param {string} text
   */
  function smartypants(text) {
    return text
    // em-dashes
    .replace(/---/g, "\u2014")
    // en-dashes
    .replace(/--/g, "\u2013")
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, "$1\u2018")
    // closing singles & apostrophes
    .replace(/'/g, "\u2019")
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1\u201C")
    // closing doubles
    .replace(/"/g, "\u201D")
    // ellipses
    .replace(/\.{3}/g, "\u2026");
  }

  /**
   * mangle email addresses
   * @param {string} text
   */
  function mangle(text) {
    var out = '',
      i,
      ch;
    var l = text.length;
    for (i = 0; i < l; i++) {
      ch = text.charCodeAt(i);
      if (Math.random() > 0.5) {
        ch = 'x' + ch.toString(16);
      }
      out += '&#' + ch + ';';
    }
    return out;
  }

  /**
   * Block Lexer
   */
  var Lexer = /*#__PURE__*/function () {
    function Lexer(options) {
      this.tokens = [];
      this.tokens.links = Object.create(null);
      this.options = options || exports.defaults;
      this.options.tokenizer = this.options.tokenizer || new Tokenizer();
      this.tokenizer = this.options.tokenizer;
      this.tokenizer.options = this.options;
      this.tokenizer.lexer = this;
      this.inlineQueue = [];
      this.state = {
        inLink: false,
        inRawBlock: false,
        top: true
      };
      var rules = {
        block: block.normal,
        inline: inline.normal
      };
      if (this.options.pedantic) {
        rules.block = block.pedantic;
        rules.inline = inline.pedantic;
      } else if (this.options.gfm) {
        rules.block = block.gfm;
        if (this.options.breaks) {
          rules.inline = inline.breaks;
        } else {
          rules.inline = inline.gfm;
        }
      }
      this.tokenizer.rules = rules;
    }

    /**
     * Expose Rules
     */
    /**
     * Static Lex Method
     */
    Lexer.lex = function lex(src, options) {
      var lexer = new Lexer(options);
      return lexer.lex(src);
    }

    /**
     * Static Lex Inline Method
     */;
    Lexer.lexInline = function lexInline(src, options) {
      var lexer = new Lexer(options);
      return lexer.inlineTokens(src);
    }

    /**
     * Preprocessing
     */;
    var _proto = Lexer.prototype;
    _proto.lex = function lex(src) {
      src = src.replace(/\r\n|\r/g, '\n');
      this.blockTokens(src, this.tokens);
      var next;
      while (next = this.inlineQueue.shift()) {
        this.inlineTokens(next.src, next.tokens);
      }
      return this.tokens;
    }

    /**
     * Lexing
     */;
    _proto.blockTokens = function blockTokens(src, tokens) {
      var _this = this;
      if (tokens === void 0) {
        tokens = [];
      }
      if (this.options.pedantic) {
        src = src.replace(/\t/g, '    ').replace(/^ +$/gm, '');
      } else {
        src = src.replace(/^( *)(\t+)/gm, function (_, leading, tabs) {
          return leading + '    '.repeat(tabs.length);
        });
      }
      var token, lastToken, cutSrc, lastParagraphClipped;
      var _loop = function _loop() {
        if (_this.options.extensions && _this.options.extensions.block && _this.options.extensions.block.some(function (extTokenizer) {
          if (token = extTokenizer.call({
            lexer: _this
          }, src, tokens)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }
          return false;
        })) {
          return "continue";
        }

        // newline
        if (token = _this.tokenizer.space(src)) {
          src = src.substring(token.raw.length);
          if (token.raw.length === 1 && tokens.length > 0) {
            // if there's a single \n as a spacer, it's terminating the last line,
            // so move it there so that we don't get unecessary paragraph tags
            tokens[tokens.length - 1].raw += '\n';
          } else {
            tokens.push(token);
          }
          return "continue";
        }

        // code
        if (token = _this.tokenizer.code(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          // An indented code block cannot interrupt a paragraph.
          if (lastToken && (lastToken.type === 'paragraph' || lastToken.type === 'text')) {
            lastToken.raw += '\n' + token.raw;
            lastToken.text += '\n' + token.text;
            _this.inlineQueue[_this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }
          return "continue";
        }

        // fences
        if (token = _this.tokenizer.fences(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // heading
        if (token = _this.tokenizer.heading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // hr
        if (token = _this.tokenizer.hr(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // blockquote
        if (token = _this.tokenizer.blockquote(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // list
        if (token = _this.tokenizer.list(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // html
        if (token = _this.tokenizer.html(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // def
        if (token = _this.tokenizer.def(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && (lastToken.type === 'paragraph' || lastToken.type === 'text')) {
            lastToken.raw += '\n' + token.raw;
            lastToken.text += '\n' + token.raw;
            _this.inlineQueue[_this.inlineQueue.length - 1].src = lastToken.text;
          } else if (!_this.tokens.links[token.tag]) {
            _this.tokens.links[token.tag] = {
              href: token.href,
              title: token.title
            };
          }
          return "continue";
        }

        // table (gfm)
        if (token = _this.tokenizer.table(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // lheading
        if (token = _this.tokenizer.lheading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // top-level paragraph
        // prevent paragraph consuming extensions by clipping 'src' to extension start
        cutSrc = src;
        if (_this.options.extensions && _this.options.extensions.startBlock) {
          var startIndex = Infinity;
          var tempSrc = src.slice(1);
          var tempStart;
          _this.options.extensions.startBlock.forEach(function (getStartIndex) {
            tempStart = getStartIndex.call({
              lexer: this
            }, tempSrc);
            if (typeof tempStart === 'number' && tempStart >= 0) {
              startIndex = Math.min(startIndex, tempStart);
            }
          });
          if (startIndex < Infinity && startIndex >= 0) {
            cutSrc = src.substring(0, startIndex + 1);
          }
        }
        if (_this.state.top && (token = _this.tokenizer.paragraph(cutSrc))) {
          lastToken = tokens[tokens.length - 1];
          if (lastParagraphClipped && lastToken.type === 'paragraph') {
            lastToken.raw += '\n' + token.raw;
            lastToken.text += '\n' + token.text;
            _this.inlineQueue.pop();
            _this.inlineQueue[_this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }
          lastParagraphClipped = cutSrc.length !== src.length;
          src = src.substring(token.raw.length);
          return "continue";
        }

        // text
        if (token = _this.tokenizer.text(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && lastToken.type === 'text') {
            lastToken.raw += '\n' + token.raw;
            lastToken.text += '\n' + token.text;
            _this.inlineQueue.pop();
            _this.inlineQueue[_this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }
          return "continue";
        }
        if (src) {
          var errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
          if (_this.options.silent) {
            console.error(errMsg);
            return "break";
          } else {
            throw new Error(errMsg);
          }
        }
      };
      while (src) {
        var _ret = _loop();
        if (_ret === "continue") continue;
        if (_ret === "break") break;
      }
      this.state.top = true;
      return tokens;
    };
    _proto.inline = function inline(src, tokens) {
      if (tokens === void 0) {
        tokens = [];
      }
      this.inlineQueue.push({
        src: src,
        tokens: tokens
      });
      return tokens;
    }

    /**
     * Lexing/Compiling
     */;
    _proto.inlineTokens = function inlineTokens(src, tokens) {
      var _this2 = this;
      if (tokens === void 0) {
        tokens = [];
      }
      var token, lastToken, cutSrc;

      // String with links masked to avoid interference with em and strong
      var maskedSrc = src;
      var match;
      var keepPrevChar, prevChar;

      // Mask out reflinks
      if (this.tokens.links) {
        var links = Object.keys(this.tokens.links);
        if (links.length > 0) {
          while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
            if (links.includes(match[0].slice(match[0].lastIndexOf('[') + 1, -1))) {
              maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
            }
          }
        }
      }
      // Mask out other blocks
      while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
        maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
      }

      // Mask out escaped em & strong delimiters
      while ((match = this.tokenizer.rules.inline.escapedEmSt.exec(maskedSrc)) != null) {
        maskedSrc = maskedSrc.slice(0, match.index + match[0].length - 2) + '++' + maskedSrc.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
        this.tokenizer.rules.inline.escapedEmSt.lastIndex--;
      }
      var _loop2 = function _loop2() {
        if (!keepPrevChar) {
          prevChar = '';
        }
        keepPrevChar = false;

        // extensions
        if (_this2.options.extensions && _this2.options.extensions.inline && _this2.options.extensions.inline.some(function (extTokenizer) {
          if (token = extTokenizer.call({
            lexer: _this2
          }, src, tokens)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }
          return false;
        })) {
          return "continue";
        }

        // escape
        if (token = _this2.tokenizer.escape(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // tag
        if (token = _this2.tokenizer.tag(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && token.type === 'text' && lastToken.type === 'text') {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }
          return "continue";
        }

        // link
        if (token = _this2.tokenizer.link(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // reflink, nolink
        if (token = _this2.tokenizer.reflink(src, _this2.tokens.links)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];
          if (lastToken && token.type === 'text' && lastToken.type === 'text') {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }
          return "continue";
        }

        // em & strong
        if (token = _this2.tokenizer.emStrong(src, maskedSrc, prevChar)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // code
        if (token = _this2.tokenizer.codespan(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // br
        if (token = _this2.tokenizer.br(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // del (gfm)
        if (token = _this2.tokenizer.del(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // autolink
        if (token = _this2.tokenizer.autolink(src, mangle)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // url (gfm)
        if (!_this2.state.inLink && (token = _this2.tokenizer.url(src, mangle))) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return "continue";
        }

        // text
        // prevent inlineText consuming extensions by clipping 'src' to extension start
        cutSrc = src;
        if (_this2.options.extensions && _this2.options.extensions.startInline) {
          var startIndex = Infinity;
          var tempSrc = src.slice(1);
          var tempStart;
          _this2.options.extensions.startInline.forEach(function (getStartIndex) {
            tempStart = getStartIndex.call({
              lexer: this
            }, tempSrc);
            if (typeof tempStart === 'number' && tempStart >= 0) {
              startIndex = Math.min(startIndex, tempStart);
            }
          });
          if (startIndex < Infinity && startIndex >= 0) {
            cutSrc = src.substring(0, startIndex + 1);
          }
        }
        if (token = _this2.tokenizer.inlineText(cutSrc, smartypants)) {
          src = src.substring(token.raw.length);
          if (token.raw.slice(-1) !== '_') {
            // Track prevChar before string of ____ started
            prevChar = token.raw.slice(-1);
          }
          keepPrevChar = true;
          lastToken = tokens[tokens.length - 1];
          if (lastToken && lastToken.type === 'text') {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }
          return "continue";
        }
        if (src) {
          var errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
          if (_this2.options.silent) {
            console.error(errMsg);
            return "break";
          } else {
            throw new Error(errMsg);
          }
        }
      };
      while (src) {
        var _ret2 = _loop2();
        if (_ret2 === "continue") continue;
        if (_ret2 === "break") break;
      }
      return tokens;
    };
    _createClass(Lexer, null, [{
      key: "rules",
      get: function get() {
        return {
          block: block,
          inline: inline
        };
      }
    }]);
    return Lexer;
  }();

  /**
   * Renderer
   */
  var Renderer = /*#__PURE__*/function () {
    function Renderer(options) {
      this.options = options || exports.defaults;
    }
    var _proto = Renderer.prototype;
    _proto.code = function code(_code, infostring, escaped) {
      var lang = (infostring || '').match(/\S*/)[0];
      if (this.options.highlight) {
        var out = this.options.highlight(_code, lang);
        if (out != null && out !== _code) {
          escaped = true;
          _code = out;
        }
      }
      _code = _code.replace(/\n$/, '') + '\n';
      if (!lang) {
        return '<pre><code>' + (escaped ? _code : escape(_code, true)) + '</code></pre>\n';
      }
      return '<pre><code class="' + this.options.langPrefix + escape(lang) + '">' + (escaped ? _code : escape(_code, true)) + '</code></pre>\n';
    }

    /**
     * @param {string} quote
     */;
    _proto.blockquote = function blockquote(quote) {
      return "<blockquote>\n" + quote + "</blockquote>\n";
    };
    _proto.html = function html(_html) {
      return _html;
    }

    /**
     * @param {string} text
     * @param {string} level
     * @param {string} raw
     * @param {any} slugger
     */;
    _proto.heading = function heading(text, level, raw, slugger) {
      if (this.options.headerIds) {
        var id = this.options.headerPrefix + slugger.slug(raw);
        return "<h" + level + " id=\"" + id + "\">" + text + "</h" + level + ">\n";
      }

      // ignore IDs
      return "<h" + level + ">" + text + "</h" + level + ">\n";
    };
    _proto.hr = function hr() {
      return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
    };
    _proto.list = function list(body, ordered, start) {
      var type = ordered ? 'ol' : 'ul',
        startatt = ordered && start !== 1 ? ' start="' + start + '"' : '';
      return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
    }

    /**
     * @param {string} text
     */;
    _proto.listitem = function listitem(text) {
      return "<li>" + text + "</li>\n";
    };
    _proto.checkbox = function checkbox(checked) {
      return '<input ' + (checked ? 'checked="" ' : '') + 'disabled="" type="checkbox"' + (this.options.xhtml ? ' /' : '') + '> ';
    }

    /**
     * @param {string} text
     */;
    _proto.paragraph = function paragraph(text) {
      return "<p>" + text + "</p>\n";
    }

    /**
     * @param {string} header
     * @param {string} body
     */;
    _proto.table = function table(header, body) {
      if (body) body = "<tbody>" + body + "</tbody>";
      return '<table>\n' + '<thead>\n' + header + '</thead>\n' + body + '</table>\n';
    }

    /**
     * @param {string} content
     */;
    _proto.tablerow = function tablerow(content) {
      return "<tr>\n" + content + "</tr>\n";
    };
    _proto.tablecell = function tablecell(content, flags) {
      var type = flags.header ? 'th' : 'td';
      var tag = flags.align ? "<" + type + " align=\"" + flags.align + "\">" : "<" + type + ">";
      return tag + content + ("</" + type + ">\n");
    }

    /**
     * span level renderer
     * @param {string} text
     */;
    _proto.strong = function strong(text) {
      return "<strong>" + text + "</strong>";
    }

    /**
     * @param {string} text
     */;
    _proto.em = function em(text) {
      return "<em>" + text + "</em>";
    }

    /**
     * @param {string} text
     */;
    _proto.codespan = function codespan(text) {
      return "<code>" + text + "</code>";
    };
    _proto.br = function br() {
      return this.options.xhtml ? '<br/>' : '<br>';
    }

    /**
     * @param {string} text
     */;
    _proto.del = function del(text) {
      return "<del>" + text + "</del>";
    }

    /**
     * @param {string} href
     * @param {string} title
     * @param {string} text
     */;
    _proto.link = function link(href, title, text) {
      href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
      if (href === null) {
        return text;
      }
      var out = '<a href="' + href + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += '>' + text + '</a>';
      return out;
    }

    /**
     * @param {string} href
     * @param {string} title
     * @param {string} text
     */;
    _proto.image = function image(href, title, text) {
      href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
      if (href === null) {
        return text;
      }
      var out = "<img src=\"" + href + "\" alt=\"" + text + "\"";
      if (title) {
        out += " title=\"" + title + "\"";
      }
      out += this.options.xhtml ? '/>' : '>';
      return out;
    };
    _proto.text = function text(_text) {
      return _text;
    };
    return Renderer;
  }();

  /**
   * TextRenderer
   * returns only the textual part of the token
   */
  var TextRenderer = /*#__PURE__*/function () {
    function TextRenderer() {}
    var _proto = TextRenderer.prototype;
    // no need for block level renderers
    _proto.strong = function strong(text) {
      return text;
    };
    _proto.em = function em(text) {
      return text;
    };
    _proto.codespan = function codespan(text) {
      return text;
    };
    _proto.del = function del(text) {
      return text;
    };
    _proto.html = function html(text) {
      return text;
    };
    _proto.text = function text(_text) {
      return _text;
    };
    _proto.link = function link(href, title, text) {
      return '' + text;
    };
    _proto.image = function image(href, title, text) {
      return '' + text;
    };
    _proto.br = function br() {
      return '';
    };
    return TextRenderer;
  }();

  /**
   * Slugger generates header id
   */
  var Slugger = /*#__PURE__*/function () {
    function Slugger() {
      this.seen = {};
    }

    /**
     * @param {string} value
     */
    var _proto = Slugger.prototype;
    _proto.serialize = function serialize(value) {
      return value.toLowerCase().trim()
      // remove html tags
      .replace(/<[!\/a-z].*?>/ig, '')
      // remove unwanted chars
      .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '').replace(/\s/g, '-');
    }

    /**
     * Finds the next safe (unique) slug to use
     * @param {string} originalSlug
     * @param {boolean} isDryRun
     */;
    _proto.getNextSafeSlug = function getNextSafeSlug(originalSlug, isDryRun) {
      var slug = originalSlug;
      var occurenceAccumulator = 0;
      if (this.seen.hasOwnProperty(slug)) {
        occurenceAccumulator = this.seen[originalSlug];
        do {
          occurenceAccumulator++;
          slug = originalSlug + '-' + occurenceAccumulator;
        } while (this.seen.hasOwnProperty(slug));
      }
      if (!isDryRun) {
        this.seen[originalSlug] = occurenceAccumulator;
        this.seen[slug] = 0;
      }
      return slug;
    }

    /**
     * Convert string to unique id
     * @param {object} [options]
     * @param {boolean} [options.dryrun] Generates the next unique slug without
     * updating the internal accumulator.
     */;
    _proto.slug = function slug(value, options) {
      if (options === void 0) {
        options = {};
      }
      var slug = this.serialize(value);
      return this.getNextSafeSlug(slug, options.dryrun);
    };
    return Slugger;
  }();

  /**
   * Parsing & Compiling
   */
  var Parser = /*#__PURE__*/function () {
    function Parser(options) {
      this.options = options || exports.defaults;
      this.options.renderer = this.options.renderer || new Renderer();
      this.renderer = this.options.renderer;
      this.renderer.options = this.options;
      this.textRenderer = new TextRenderer();
      this.slugger = new Slugger();
    }

    /**
     * Static Parse Method
     */
    Parser.parse = function parse(tokens, options) {
      var parser = new Parser(options);
      return parser.parse(tokens);
    }

    /**
     * Static Parse Inline Method
     */;
    Parser.parseInline = function parseInline(tokens, options) {
      var parser = new Parser(options);
      return parser.parseInline(tokens);
    }

    /**
     * Parse Loop
     */;
    var _proto = Parser.prototype;
    _proto.parse = function parse(tokens, top) {
      if (top === void 0) {
        top = true;
      }
      var out = '',
        i,
        j,
        k,
        l2,
        l3,
        row,
        cell,
        header,
        body,
        token,
        ordered,
        start,
        loose,
        itemBody,
        item,
        checked,
        task,
        checkbox,
        ret;
      var l = tokens.length;
      for (i = 0; i < l; i++) {
        token = tokens[i];

        // Run any renderer extensions
        if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
          ret = this.options.extensions.renderers[token.type].call({
            parser: this
          }, token);
          if (ret !== false || !['space', 'hr', 'heading', 'code', 'table', 'blockquote', 'list', 'html', 'paragraph', 'text'].includes(token.type)) {
            out += ret || '';
            continue;
          }
        }
        switch (token.type) {
          case 'space':
            {
              continue;
            }
          case 'hr':
            {
              out += this.renderer.hr();
              continue;
            }
          case 'heading':
            {
              out += this.renderer.heading(this.parseInline(token.tokens), token.depth, unescape(this.parseInline(token.tokens, this.textRenderer)), this.slugger);
              continue;
            }
          case 'code':
            {
              out += this.renderer.code(token.text, token.lang, token.escaped);
              continue;
            }
          case 'table':
            {
              header = '';

              // header
              cell = '';
              l2 = token.header.length;
              for (j = 0; j < l2; j++) {
                cell += this.renderer.tablecell(this.parseInline(token.header[j].tokens), {
                  header: true,
                  align: token.align[j]
                });
              }
              header += this.renderer.tablerow(cell);
              body = '';
              l2 = token.rows.length;
              for (j = 0; j < l2; j++) {
                row = token.rows[j];
                cell = '';
                l3 = row.length;
                for (k = 0; k < l3; k++) {
                  cell += this.renderer.tablecell(this.parseInline(row[k].tokens), {
                    header: false,
                    align: token.align[k]
                  });
                }
                body += this.renderer.tablerow(cell);
              }
              out += this.renderer.table(header, body);
              continue;
            }
          case 'blockquote':
            {
              body = this.parse(token.tokens);
              out += this.renderer.blockquote(body);
              continue;
            }
          case 'list':
            {
              ordered = token.ordered;
              start = token.start;
              loose = token.loose;
              l2 = token.items.length;
              body = '';
              for (j = 0; j < l2; j++) {
                item = token.items[j];
                checked = item.checked;
                task = item.task;
                itemBody = '';
                if (item.task) {
                  checkbox = this.renderer.checkbox(checked);
                  if (loose) {
                    if (item.tokens.length > 0 && item.tokens[0].type === 'paragraph') {
                      item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
                      if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
                        item.tokens[0].tokens[0].text = checkbox + ' ' + item.tokens[0].tokens[0].text;
                      }
                    } else {
                      item.tokens.unshift({
                        type: 'text',
                        text: checkbox
                      });
                    }
                  } else {
                    itemBody += checkbox;
                  }
                }
                itemBody += this.parse(item.tokens, loose);
                body += this.renderer.listitem(itemBody, task, checked);
              }
              out += this.renderer.list(body, ordered, start);
              continue;
            }
          case 'html':
            {
              // TODO parse inline content if parameter markdown=1
              out += this.renderer.html(token.text);
              continue;
            }
          case 'paragraph':
            {
              out += this.renderer.paragraph(this.parseInline(token.tokens));
              continue;
            }
          case 'text':
            {
              body = token.tokens ? this.parseInline(token.tokens) : token.text;
              while (i + 1 < l && tokens[i + 1].type === 'text') {
                token = tokens[++i];
                body += '\n' + (token.tokens ? this.parseInline(token.tokens) : token.text);
              }
              out += top ? this.renderer.paragraph(body) : body;
              continue;
            }
          default:
            {
              var errMsg = 'Token with "' + token.type + '" type was not found.';
              if (this.options.silent) {
                console.error(errMsg);
                return;
              } else {
                throw new Error(errMsg);
              }
            }
        }
      }
      return out;
    }

    /**
     * Parse Inline Tokens
     */;
    _proto.parseInline = function parseInline(tokens, renderer) {
      renderer = renderer || this.renderer;
      var out = '',
        i,
        token,
        ret;
      var l = tokens.length;
      for (i = 0; i < l; i++) {
        token = tokens[i];

        // Run any renderer extensions
        if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
          ret = this.options.extensions.renderers[token.type].call({
            parser: this
          }, token);
          if (ret !== false || !['escape', 'html', 'link', 'image', 'strong', 'em', 'codespan', 'br', 'del', 'text'].includes(token.type)) {
            out += ret || '';
            continue;
          }
        }
        switch (token.type) {
          case 'escape':
            {
              out += renderer.text(token.text);
              break;
            }
          case 'html':
            {
              out += renderer.html(token.text);
              break;
            }
          case 'link':
            {
              out += renderer.link(token.href, token.title, this.parseInline(token.tokens, renderer));
              break;
            }
          case 'image':
            {
              out += renderer.image(token.href, token.title, token.text);
              break;
            }
          case 'strong':
            {
              out += renderer.strong(this.parseInline(token.tokens, renderer));
              break;
            }
          case 'em':
            {
              out += renderer.em(this.parseInline(token.tokens, renderer));
              break;
            }
          case 'codespan':
            {
              out += renderer.codespan(token.text);
              break;
            }
          case 'br':
            {
              out += renderer.br();
              break;
            }
          case 'del':
            {
              out += renderer.del(this.parseInline(token.tokens, renderer));
              break;
            }
          case 'text':
            {
              out += renderer.text(token.text);
              break;
            }
          default:
            {
              var errMsg = 'Token with "' + token.type + '" type was not found.';
              if (this.options.silent) {
                console.error(errMsg);
                return;
              } else {
                throw new Error(errMsg);
              }
            }
        }
      }
      return out;
    };
    return Parser;
  }();

  /**
   * Marked
   */
  function marked(src, opt, callback) {
    // throw error in case of non string input
    if (typeof src === 'undefined' || src === null) {
      throw new Error('marked(): input parameter is undefined or null');
    }
    if (typeof src !== 'string') {
      throw new Error('marked(): input parameter is of type ' + Object.prototype.toString.call(src) + ', string expected');
    }
    if (typeof opt === 'function') {
      callback = opt;
      opt = null;
    }
    opt = merge({}, marked.defaults, opt || {});
    checkSanitizeDeprecation(opt);
    if (callback) {
      var highlight = opt.highlight;
      var tokens;
      try {
        tokens = Lexer.lex(src, opt);
      } catch (e) {
        return callback(e);
      }
      var done = function done(err) {
        var out;
        if (!err) {
          try {
            if (opt.walkTokens) {
              marked.walkTokens(tokens, opt.walkTokens);
            }
            out = Parser.parse(tokens, opt);
          } catch (e) {
            err = e;
          }
        }
        opt.highlight = highlight;
        return err ? callback(err) : callback(null, out);
      };
      if (!highlight || highlight.length < 3) {
        return done();
      }
      delete opt.highlight;
      if (!tokens.length) return done();
      var pending = 0;
      marked.walkTokens(tokens, function (token) {
        if (token.type === 'code') {
          pending++;
          setTimeout(function () {
            highlight(token.text, token.lang, function (err, code) {
              if (err) {
                return done(err);
              }
              if (code != null && code !== token.text) {
                token.text = code;
                token.escaped = true;
              }
              pending--;
              if (pending === 0) {
                done();
              }
            });
          }, 0);
        }
      });
      if (pending === 0) {
        done();
      }
      return;
    }
    function onError(e) {
      e.message += '\nPlease report this to https://github.com/markedjs/marked.';
      if (opt.silent) {
        return '<p>An error occurred:</p><pre>' + escape(e.message + '', true) + '</pre>';
      }
      throw e;
    }
    try {
      var _tokens = Lexer.lex(src, opt);
      if (opt.walkTokens) {
        if (opt.async) {
          return Promise.all(marked.walkTokens(_tokens, opt.walkTokens)).then(function () {
            return Parser.parse(_tokens, opt);
          })["catch"](onError);
        }
        marked.walkTokens(_tokens, opt.walkTokens);
      }
      return Parser.parse(_tokens, opt);
    } catch (e) {
      onError(e);
    }
  }

  /**
   * Options
   */

  marked.options = marked.setOptions = function (opt) {
    merge(marked.defaults, opt);
    changeDefaults(marked.defaults);
    return marked;
  };
  marked.getDefaults = getDefaults;
  marked.defaults = exports.defaults;

  /**
   * Use Extension
   */

  marked.use = function () {
    var extensions = marked.defaults.extensions || {
      renderers: {},
      childTokens: {}
    };
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    args.forEach(function (pack) {
      // copy options to new object
      var opts = merge({}, pack);

      // set async to true if it was set to true before
      opts.async = marked.defaults.async || opts.async;

      // ==-- Parse "addon" extensions --== //
      if (pack.extensions) {
        pack.extensions.forEach(function (ext) {
          if (!ext.name) {
            throw new Error('extension name required');
          }
          if (ext.renderer) {
            // Renderer extensions
            var prevRenderer = extensions.renderers[ext.name];
            if (prevRenderer) {
              // Replace extension with func to run new extension but fall back if false
              extensions.renderers[ext.name] = function () {
                for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                  args[_key2] = arguments[_key2];
                }
                var ret = ext.renderer.apply(this, args);
                if (ret === false) {
                  ret = prevRenderer.apply(this, args);
                }
                return ret;
              };
            } else {
              extensions.renderers[ext.name] = ext.renderer;
            }
          }
          if (ext.tokenizer) {
            // Tokenizer Extensions
            if (!ext.level || ext.level !== 'block' && ext.level !== 'inline') {
              throw new Error("extension level must be 'block' or 'inline'");
            }
            if (extensions[ext.level]) {
              extensions[ext.level].unshift(ext.tokenizer);
            } else {
              extensions[ext.level] = [ext.tokenizer];
            }
            if (ext.start) {
              // Function to check for start of token
              if (ext.level === 'block') {
                if (extensions.startBlock) {
                  extensions.startBlock.push(ext.start);
                } else {
                  extensions.startBlock = [ext.start];
                }
              } else if (ext.level === 'inline') {
                if (extensions.startInline) {
                  extensions.startInline.push(ext.start);
                } else {
                  extensions.startInline = [ext.start];
                }
              }
            }
          }
          if (ext.childTokens) {
            // Child tokens to be visited by walkTokens
            extensions.childTokens[ext.name] = ext.childTokens;
          }
        });
        opts.extensions = extensions;
      }

      // ==-- Parse "overwrite" extensions --== //
      if (pack.renderer) {
        var renderer = marked.defaults.renderer || new Renderer();
        var _loop = function _loop(prop) {
          var prevRenderer = renderer[prop];
          // Replace renderer with func to run extension, but fall back if false
          renderer[prop] = function () {
            for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
              args[_key3] = arguments[_key3];
            }
            var ret = pack.renderer[prop].apply(renderer, args);
            if (ret === false) {
              ret = prevRenderer.apply(renderer, args);
            }
            return ret;
          };
        };
        for (var prop in pack.renderer) {
          _loop(prop);
        }
        opts.renderer = renderer;
      }
      if (pack.tokenizer) {
        var tokenizer = marked.defaults.tokenizer || new Tokenizer();
        var _loop2 = function _loop2(_prop) {
          var prevTokenizer = tokenizer[_prop];
          // Replace tokenizer with func to run extension, but fall back if false
          tokenizer[_prop] = function () {
            for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
              args[_key4] = arguments[_key4];
            }
            var ret = pack.tokenizer[_prop].apply(tokenizer, args);
            if (ret === false) {
              ret = prevTokenizer.apply(tokenizer, args);
            }
            return ret;
          };
        };
        for (var _prop in pack.tokenizer) {
          _loop2(_prop);
        }
        opts.tokenizer = tokenizer;
      }

      // ==-- Parse WalkTokens extensions --== //
      if (pack.walkTokens) {
        var _walkTokens = marked.defaults.walkTokens;
        opts.walkTokens = function (token) {
          var values = [];
          values.push(pack.walkTokens.call(this, token));
          if (_walkTokens) {
            values = values.concat(_walkTokens.call(this, token));
          }
          return values;
        };
      }
      marked.setOptions(opts);
    });
  };

  /**
   * Run callback for every token
   */

  marked.walkTokens = function (tokens, callback) {
    var values = [];
    var _loop3 = function _loop3() {
      var token = _step.value;
      values = values.concat(callback.call(marked, token));
      switch (token.type) {
        case 'table':
          {
            for (var _iterator2 = _createForOfIteratorHelperLoose(token.header), _step2; !(_step2 = _iterator2()).done;) {
              var cell = _step2.value;
              values = values.concat(marked.walkTokens(cell.tokens, callback));
            }
            for (var _iterator3 = _createForOfIteratorHelperLoose(token.rows), _step3; !(_step3 = _iterator3()).done;) {
              var row = _step3.value;
              for (var _iterator4 = _createForOfIteratorHelperLoose(row), _step4; !(_step4 = _iterator4()).done;) {
                var _cell = _step4.value;
                values = values.concat(marked.walkTokens(_cell.tokens, callback));
              }
            }
            break;
          }
        case 'list':
          {
            values = values.concat(marked.walkTokens(token.items, callback));
            break;
          }
        default:
          {
            if (marked.defaults.extensions && marked.defaults.extensions.childTokens && marked.defaults.extensions.childTokens[token.type]) {
              // Walk any extensions
              marked.defaults.extensions.childTokens[token.type].forEach(function (childTokens) {
                values = values.concat(marked.walkTokens(token[childTokens], callback));
              });
            } else if (token.tokens) {
              values = values.concat(marked.walkTokens(token.tokens, callback));
            }
          }
      }
    };
    for (var _iterator = _createForOfIteratorHelperLoose(tokens), _step; !(_step = _iterator()).done;) {
      _loop3();
    }
    return values;
  };

  /**
   * Parse Inline
   * @param {string} src
   */
  marked.parseInline = function (src, opt) {
    // throw error in case of non string input
    if (typeof src === 'undefined' || src === null) {
      throw new Error('marked.parseInline(): input parameter is undefined or null');
    }
    if (typeof src !== 'string') {
      throw new Error('marked.parseInline(): input parameter is of type ' + Object.prototype.toString.call(src) + ', string expected');
    }
    opt = merge({}, marked.defaults, opt || {});
    checkSanitizeDeprecation(opt);
    try {
      var tokens = Lexer.lexInline(src, opt);
      if (opt.walkTokens) {
        marked.walkTokens(tokens, opt.walkTokens);
      }
      return Parser.parseInline(tokens, opt);
    } catch (e) {
      e.message += '\nPlease report this to https://github.com/markedjs/marked.';
      if (opt.silent) {
        return '<p>An error occurred:</p><pre>' + escape(e.message + '', true) + '</pre>';
      }
      throw e;
    }
  };

  /**
   * Expose
   */
  marked.Parser = Parser;
  marked.parser = Parser.parse;
  marked.Renderer = Renderer;
  marked.TextRenderer = TextRenderer;
  marked.Lexer = Lexer;
  marked.lexer = Lexer.lex;
  marked.Tokenizer = Tokenizer;
  marked.Slugger = Slugger;
  marked.parse = marked;
  var options = marked.options;
  var setOptions = marked.setOptions;
  var use = marked.use;
  var walkTokens = marked.walkTokens;
  var parseInline = marked.parseInline;
  var parse = marked;
  var parser = Parser.parse;
  var lexer = Lexer.lex;

  exports.Lexer = Lexer;
  exports.Parser = Parser;
  exports.Renderer = Renderer;
  exports.Slugger = Slugger;
  exports.TextRenderer = TextRenderer;
  exports.Tokenizer = Tokenizer;
  exports.getDefaults = getDefaults;
  exports.lexer = lexer;
  exports.marked = marked;
  exports.options = options;
  exports.parse = parse;
  exports.parseInline = parseInline;
  exports.parser = parser;
  exports.setOptions = setOptions;
  exports.use = use;
  exports.walkTokens = walkTokens;

}));
