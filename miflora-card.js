console.info("%c  MIFLORA-CARD  \n%c Version 0.1.3 ", "color: orange; font-weight: bold; background: black", "color: white; font-weight: bold; background: dimgray");
class MifloraCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });

        this.sensors = {
            moisture: 'hass:water',
            temperature: 'hass:thermometer',
            intensity: 'hass:white-balance-sunny',
            conductivity: 'hass:emoticon-poop',
            battery: 'hass:battery'
        };

    }

    _computeIcon(sensor, state) {
        const icon = this.sensors[sensor];
        if (sensor === 'battery') {
            if (state <= 5) {
                return `${icon}-alert`;
            } else if (state < 95) {
                return `${icon}-${Math.round((state / 10) - 0.01) * 10}`;
            }
        }
        return icon;
    }

    _click(entity) {
        this._fire('hass-more-info', {
            entityId: entity
        });
    }

    _fire(type, detail) {
        const event = new Event(type, {
            bubbles: true,
            cancelable: false,
            composed: true
        });
        event.detail = detail || {};
        this.shadowRoot.dispatchEvent(event);
        return event;
    }

    //Home Assistant will set the hass property when the state of Home Assistant changes (frequent).
    set hass(hass) {
        const config = this.config;

        var _maxIntensity = parseFloat(config.max_intensity);
        var _minIntensity = parseFloat(config.min_intensity);
        var _maxMoisture = parseFloat(config.max_moisture);
        var _minMoisture = parseFloat(config.min_moisture);
        var _maxConductivity = parseFloat(config.max_conductivity);
        var _minConductivity = parseFloat(config.min_conductivity);
        var _maxTemperature = parseFloat(config.max_termperature);
        var _minTemperature = parseFloat(config.min_termperature);

        this.shadowRoot.getElementById('container').innerHTML = `
            <div class="content clearfix">
                <div id="sensors"></div>
            </div>
            `;

        for (var i = 0; i < config.entities.length; i++) {
            var _name = config.entities[i]['type'];
            var _sensor = config.entities[i]['entity'];
            if (config.entities[i]['name']) {
                var _display_name = config.entities[i]['name'];
            } else {
                var _display_name = _name[0].toUpperCase() + _name.slice(1);
            }
            var _state = '';
            var _uom = '';
            if (hass.states[_sensor]) {
                _state = parseFloat(hass.states[_sensor].state);
                _uom = hass.states[_sensor].attributes.unit_of_measurement || "";
            } else {
                _state = 'Invalid Sensor';
            }

            var _icon = this._computeIcon(_name, _state);
            var _alertStyle = '';
            var _alertIcon = '';
            if (_name == 'intensity') {
                if (_state > _maxIntensity) {
                    _alertStyle = ';color:red';
                    _alertIcon = '&#9650; ';
                } else if (_state < _minIntensity) {
                    _alertStyle = ';color:red';
                    _alertIcon = '&#9660; ';
                }
            }
            if (_name == 'moisture') {
                if (_state > _maxMoisture) {
                    _alertStyle = ';color:red';
                    _alertIcon = '&#9650; ';
                } else if (_state < _minMoisture) {
                    _alertStyle = ';color:red';
                    _alertIcon = '&#9660; '
                }
            }
            if (_name == 'conductivity') {
                if (_state > _maxConductivity) {
                    _alertStyle = ';color:red';
                    _alertIcon = '&#9650; ';
                } else if (_state < _minConductivity) {
                    _alertStyle = ';color:red';
                    _alertIcon = '&#9660; ';
                }
            }
            if (_name == 'temperature') {
                if (_state > _maxTemperature) {
                    _alertStyle = ';color:red';
                    _alertIcon = '&#9650; ';
                } else if (_state < _minTemperature) {
                    _alertStyle = ';color:red';
                    _alertIcon = '&#9660; ';
                }
            }
            this.shadowRoot.getElementById('sensors').innerHTML += `
                <div id="sensor${i}" class="sensor">
                    <div class="icon"><ha-icon icon="${_icon}"></ha-icon></div>
                    <div class="name">${_display_name[0].toUpperCase()}${_display_name.slice(1)}</div>
                    <div class="state" style="${_alertStyle}">${_alertIcon}${_state}${_uom}</div>
                </div>
                `
        }

        for (var i = 0; i < config.entities.length; i++) {
            this.shadowRoot.getElementById('sensor' + [i]).onclick = this._click.bind(this, config.entities[i]['entity']);
        }
    }

    //  Home Assistant will call setConfig(config) when the configuration changes (rare).
    setConfig(config) {
        if (!config.entities) {
            throw new Error('Please define an entity');
        }

        const root = this.shadowRoot;
        if (root.lastChild) root.removeChild(root.lastChild);

        this.config = config;

        const card = document.createElement('ha-card');
        const content = document.createElement('div');
        const plantimage = document.createElement('div');
        const style = document.createElement('style');

        style.textContent = `
            ha-card {
                position: relative;
                padding: 0;
                background-size: 100%;
            }
            ha-card .header {
                width: 100%;
            }
            .image {
                float: right;
                margin-left: 16px;
                margin-right: 16px;
                margin-bottom: 16px;
                width: 155px;
                height: 155px;
                border-radius: 6px;
            }
            .sensor {
                padding-top: 10px;
                padding-bottom: 10px;
                margin-right: 16px;
                display: flex;
                cursor: pointer;
            }
            .icon {
                color: var(--paper-item-icon-color);
            }
            .name {
                margin-top: 3px;
                margin-left: 16px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .state {
                white-space: nowrap;
                overflow: hidden;
                margin-top: 3px;
                margin-left: auto
            }
            .uom {
                color: var(--secondary-text-color);
            }
            .clearfix::after {
                content: "";
                clear: both;
                display: table;
            }
            `;
        plantimage.innerHTML = `
            <img class="image" src=${config.image}>  
            `;

        content.id = "container";
        card.header = config.title;
        card.appendChild(plantimage);
        card.appendChild(content);
        content.setAttribute("class", "card-content");
        card.appendChild(style);
        root.appendChild(card);
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return 2;
    }
}

customElements.define('miflora-card', MifloraCard);
