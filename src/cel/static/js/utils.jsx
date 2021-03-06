if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.lastIndexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

var checkStatus = (response) => {
    if (response.status >= 200 && response.status <= 401) {
        return response
    }
    else {
        try {
            // If we got a forbidden (403) response,
            // *AND* we're not already in the login page
            // *AND* the call we've made was for the Euskal Moneta API and *NOT* the Django front
            // we redirect to the login page, in this page a "session expired" message will be displayed
            if (response.statusText == "Forbidden"
                && window.location.pathname.indexOf("/login") === -1
                && response.url.indexOf(window.config.getAPIBaseURL) != -1) {
                window.location.assign("/logout?next=" + window.location.pathname)
            }
            else {
                var error = new Error(response.statusText)
                error.response = response
                throw error
            }
        }
        catch(e) {
            var error = new Error(response.statusText)
            error.response = response
            throw error
        }
    }
}

var parseJSON = (response) => {
    if (response.status == 204) {
        return {}
    }
    else if (response.status == 400 || response.status == 401) {
        var error = new Error(response.statusText)
        error.response = response
        throw error
    }
    else {
        return response.json()
    }
}

var parseBLOB = (response) => {
    return response.blob()
}

var checkSession = (data) => {
    try {
        if (data.detail.toUpperCase().indexOf("LOGGED_OUT") != -1) {
            window.location.assign("/logout?next=" + window.location.pathname)
        }
        else if (data.detail.indexOf("Exception") != -1) {
            var error = new Error(data)
            error.response = data
            throw error
        }
        else {
            return data
        }
    }
    catch(e) {
        return data
    }
}

var storeToken = (data) => {
    // Save data to sessionStorage
    sessionStorage.setItem('cel-api-token-auth', data.token)
    return data.token
}

var getToken = () => {
    // Get saved data from sessionStorage
    return sessionStorage.getItem('cel-api-token-auth')
}

var fetchCustom = (url, method, promise, token, data, promiseError=null, accept=null) => {
    if (!accept) {
        var accept = 'application/json'
    }

    var payload = {
        method: method,
        headers: {
            'Accept': accept,
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + token
        }
    }

    if (method.toLowerCase() != 'get' && data != null) {
        payload.body = JSON.stringify(data)
    }

    if (!promiseError) {
        var promiseError = (err) => {
            // Error during request, or parsing NOK :(
            if (err.message != "No content") {
                console.error(url, method, promise, token, data, promiseError, err)
            }
        }
    }

    fetch(url, payload)
    .then(checkStatus)
    .then(accept == 'application/json' ? parseJSON : parseBLOB)
    .then(checkSession)
    .then(promise)
    .catch(promiseError)
}

var fetchGetToken = (username, password, promiseSuccess, promiseError) => {
    sessionStorage.removeItem('cel-api-token-auth')

    fetch(getAPIBaseURL + 'api-token-auth/',
    {
        method: 'post',
        body: JSON.stringify({'username': username, 'password': password}),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(checkStatus)
    .then(parseJSON)
    .then(storeToken)
    .then(promiseSuccess)
    .catch(promiseError)
}

var fetchAuth = (url, method, promise, data=null, promiseError=null, accept=null) => {
    var token = getToken()
    if (token) {
        // We have a token
        fetchCustom(url, method, promise, token, data, promiseError, accept)
    }
    else {
        // We need a token
        if (location.pathname != window.config.getLoginURL) {
            // Redirect to login page is needed
            console.error("We need a token, we redirect to login")
            console.error(window.config.getLoginURL)
            window.location.assign(window.config.getLoginURL)
        }
    }
}

var fetchNoAuth = (url, method, promise, data=null, promiseError=null) => {
    var payload = {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }

    if (method.toLowerCase() != 'get' && data != null) {
        payload.body = JSON.stringify(data)
    }

    if (!promiseError) {
        var promiseError = (err) => {
            // Error during request, or parsing NOK :(
            if (err.message != "No content") {
                console.error(url, method, promise, data, promiseError, err)
            }
        }
    }

    fetch(url, payload)
    .then(checkStatus)
    .then(parseJSON)
    .then(promise)
    .catch(promiseError)
}

var getUrlParameter = (name) => {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

var isMemberIdEusko = (values, value) => {
    return value && value.match(/^[EZ]\d\d\d\d\d$/)
}

var isBdcIdEusko = (values, value) => {
    return value && value.match(/^B\d\d\d$/)
}

var isPositiveNumeric = (values, value) => {
    if (!value || value == 0) {
        return false
    }

    if (value.match(/^\+?(?:\d*[.])?\d+$/))
        return true
    else
        return false
}

var titleCase = (str) => {
    if ((str===null) || (str===''))
        return false;
    else
        str = str.toString();

    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

var getCurrentLang = document.documentElement.lang
var getCSRFToken = window.config.getCSRFToken
var getAPIBaseURL = window.config.getAPIBaseURL


class NavbarItems extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            classes: props.classes ? props.classes : 'nav navbar-nav',
            objects: props.objects ? props.objects : [],
        }
    }

    componentWillReceiveProps(nextProps) {
        const isObjectsChanging = nextProps.objects !== this.props.objects
        if (isObjectsChanging) {
            this.setState({objects: nextProps.objects})
        }

        const isClassesChanging = nextProps.classes !== this.props.classes
        if (isClassesChanging) {
            this.setState({classes: nextProps.classes})
        }
    }

    render() {
        if (_.isEmpty(this.state.objects)) {
            var navbarData = undefined
        }
        else {
            var navbarData = _.map(this.state.objects, (item) => {
                if (item) {
                    if (item.href) {
                        if (item.href == '/logout') {
                            return (
                                <li key={item.id} className="log-out">
                                    <a href={item.href}>{item.label + ' '}
                                        <span className="glyphicon glyphicon-log-out"></span>
                                    </a>
                                </li>
                            )
                        }
                        else {
                            return (
                                <li key={item.id}>
                                    <a className={item.status == "active" ? "active" : ""} href={item.href}>{item.label}</a>
                                </li>
                            )
                        }
                    }
                    else if (item.data) {
                        return (
                            <li key={item.id}>
                                <a>{item.data}</a>
                            </li>
                        )
                    }
                    else {
                        return (
                            <li key={item.id}>
                                <a className={item.status == "active" ? "active" : ""}>{item.label}</a>
                            </li>
                        )
                    }
                }
            })
        }

        if (navbarData) {
            return (
                <ul className={this.state.classes}>
                    {navbarData}
                </ul>
            )
        }
        else return null
    }
}

class SubNavbar extends React.Component {

    // The 'id' fields are mandatory!
    subNavbarObjects = [
        {parent: '/compte',
         accountMandatory: true,
         listObjects: [{href: '/compte/synthese', label: __("Synthèse"), status: 'inactive', id: 0},
                       {href: '/compte/historique', label: __("Historique"), status: 'inactive', id: 1}]},
        {parent: '/virements',
         accountMandatory: true,
         listObjects: [{href: '/virements/ponctuel', label: __("Virement ponctuel"), status: 'inactive', id: 0},
                       {href: '/virements/beneficiaires', label: __("Gestion des bénéficiaires"), status: 'inactive', id: 1}]},
        {parent: '/euskokart', accountMandatory: true, listObjects: []},
        {parent: '/profil',
         accountMandatory: false,
         listObjects: [{href: '/profil/coordonnees', label: __("Coordonnées"),
                        accountMandatory: false, status: 'inactive', id: 0},
                       {href: '/profil/association', label: __("Association 3%"),
                        accountMandatory: false, status: 'inactive', id: 1},
                       {href: '/profil/options', label: __("Options"),
                        accountMandatory: false, status: 'inactive', id: 2},
                       {href: '/profil/change-passe', label: __("Mot de passe"),
                        accountMandatory: false, status: 'inactive', id: 3},
                       {href: '/profil/change-automatique', label: __("Change automatique"),
                        accountMandatory: true, status: 'inactive', id: 4},
                       {href: '/profil/cotisation', label: __("Cotisation"),
                        accountMandatory: true, status: 'inactive', id: 5}]},
    ]

    subNavbarObjectsReconversion = (
        {parent: '/compte',
         accountMandatory: true,
         listObjects: [{href: '/compte/synthese', label: __("Synthèse"), status: 'inactive', id: 0},
                       {href: '/compte/historique', label: __("Historique"), status: 'inactive', id: 1},
                       {href: '/compte/synthese/reconvertir', label: __("Reconversion"), status: 'inactive', id: 2}]
        }
    )

    constructor(props) {
        super(props);

        this.state = {
            objects: this.computeSubNavbarObjects(props.accountEnabled, props.activeObject[0]),
            activeObject: props.activeObject[0],
            accountEnabled: props.accountEnabled,
        }
    }

    computeSubNavbarObjects(accountEnabled, activeObject) {
        if (activeObject === undefined) {
            return Array()
        }

        var subNavbarObjects = this.subNavbarObjects

        // We want to add a link 'Reconversion' in navbar when we are in this page
        if (window.location.pathname.indexOf("/reconvertir") != -1) {
            var subNavbarObjects = _.filter(this.subNavbarObjects, (item) => { return item.parent != '/compte' })
            subNavbarObjects.push(this.subNavbarObjectsReconversion)
        }

        return _.chain(subNavbarObjects)
                .filter((item) => { return item.parent == activeObject.href })
                .filter((item) => {
                        if (accountEnabled)
                            return true
                        else
                            return item.accountMandatory === accountEnabled
                })
                .map((item) => {
                    return _.map(item.listObjects, (subitem) => {
                        if (window.location.pathname.toLowerCase().endsWith(subitem.href)) {
                            subitem.status = 'active'
                        }

                        return subitem
                    })
                })
                .flatten(true)
                .filter((item) => {
                        if (accountEnabled)
                            return true
                        else
                            return item.accountMandatory === accountEnabled
                })
                .value()
    }

    componentWillReceiveProps(nextProps) {
        const isAccountEnabledChanging = nextProps.accountEnabled !== this.state.accountEnabled
        if (isAccountEnabledChanging) {
            this.setState({accountEnabled: nextProps.accountEnabled})
        }

        const isActiveObjectChanging = nextProps.activeObject[0] !== this.state.activeObject
        if (isActiveObjectChanging) {
            this.setState({activeObject: nextProps.activeObject[0]})
        }

        // objects aren't passed through props !
        this.setState({objects: this.computeSubNavbarObjects(nextProps.accountEnabled, nextProps.activeObject[0])})
    }

    render() {
        if (_.isEmpty(this.state.objects)) {
            return null
        }
        else {
            return (
                <div className="navbar navbar-static-top subnav">
                    <div className="container">
                        <div className="collapse navbar-collapse">
                            <NavbarItems objects={this.state.objects} classes={'nav navbar-nav'} />
                        </div>
                    </div>
                </div>
            )
        }
    }
}

class Navbar extends React.Component {

    // The 'id' fields are mandatory!
    baseNavbarObjects = [{href: '/compte', label: __("Mon compte"),
                          status: 'inactive', id: 0, accountMandatory: true},
                         {href: '/virements', label: __("Mes virements"),
                          status: 'inactive', id: 1, accountMandatory: true},
                         {href: '/euskokart', label: __("Mon euskokart"),
                          status: 'inactive', id: 2, accountMandatory: true},
                         {href: '/profil', label: __("Mon profil"),
                          status: 'inactive', id: 3, accountMandatory: false},
                         ]

    navbarObjects = _.map(this.baseNavbarObjects,
                        (item) => {
                            if (window.location.pathname.toLowerCase().indexOf(item.href.substring(1)) != -1) {
                                item.status = 'active'
                            }

                            return item
                        })

    constructor(props) {
        super(props);

        this.state = {
            objects: _.filter(this.navbarObjects, (item) => { return item.accountMandatory === false }),
            userAuth: window.config.userAuth,
            userHasAcceptedCGU: window.config.userAuth ? window.config.profile.has_accepted_cgu : false,
            userHasValidMembership: window.config.userAuth ? window.config.profile.has_valid_membership : false,
        }
    }

    componentDidMount() {
        var objects = _.filter(this.navbarObjects, (item) => {
            if (window.config.profile.has_account_eusko_numerique)
                return true
            else
                return item.accountMandatory === window.config.profile.has_account_eusko_numerique
        })

        this.setState({objects: objects})
    }

    render() {
        if (this.state.userAuth && this.state.userHasAcceptedCGU && this.state.userHasValidMembership) {
            return (
                <div>
                    <div className="navbar navbar-static-top navbar-content">
                        <div className="container">
                            <div className="collapse navbar-collapse main-nav">
                                <NavbarItems objects={this.state.objects} classes={'nav navbar-nav'} />
                            </div>
                        </div>
                    </div>
                    <SubNavbar
                        accountEnabled={window.config.profile.has_account_eusko_numerique}
                        activeObject={_.chain(this.state.objects)
                                       .filter((item) => { return item.status == 'active' })
                                       .flatten(true)
                                       .value()}
                    />
                </div>
            )
        }
        else return null
    }
}

class TopbarRight extends React.Component {
    constructor(props) {
        super(props);

        moment.locale(document.documentElement.lang)

        this.state = {
            memberData: window.config.userAuth ? window.config.profile.display_name : '',
            objects: Array(),
            userAuth: window.config.userAuth,
        }
    }

    tick() {
        this.setState((previousState, currentProps) => {
            if (previousState.objects.length == 0) {
                var objects = currentProps.objects
            }
            else {
                var objects = previousState.objects
            }

            return {objects:
                _.map(objects, (item) => {
                    if (item) {
                        if (item.id === 0) {
                            item.data = moment().format('DD/MM/YYYY HH:mm:ss')
                            return item
                        }
                        else if (this.state.userAuth) {
                            if (item.id === 1 && this.state.memberData) {
                                item.data = window.config.userName + ' - ' + this.state.memberData
                                return item
                            }

                            return item
                        }
                    }
                })
            }
        })
    }

    componentDidMount() {
        setInterval(() => { this.tick() }, 1000)
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps) {
            this.setState(newProps)
        }
    }

    render() {
        return (
            <NavbarItems objects={this.state.objects} classes={"nav navbar-nav navbar-right topbar-right"} />
        )
    }
}

class SelectizeUtils {
    // generic callback for all selectize objects
    static selectizeCreateFromSearch(options, search) {
        // Pretty much self explanatory:
        // this function is called when we start typing inside the select
        if (search)
        {
            if (search.length == 0 || (options.map(function(option)
            {
                return option.label;
            })).indexOf(search) > -1)
                return null;
            else
                return {label: search, value: search};
        }
        else
            return null;
    }

    static selectizeRenderOption (item) {
        // This is how the list itself is displayed
        return    <div className="simple-option" style={{display: "flex", alignItems: "center"}}>
                    <div className="memberaddform" style={{marginLeft: 10}}>
                        {item.label}
                    </div>
                </div>
    }

    static selectizeNewRenderOption (item) {
        // This is how the list itself is displayed
        return    <div className="simple-option" style={{display: "flex", alignItems: "center"}}>
                    <div className="memberaddform" style={{marginLeft: 10}}>
                        {!!item.newOption ? __("Ajouter") + " " + item.label + " ..." : item.label}
                    </div>
                </div>
    }

    static selectizeRenderValue (item) {
        // When we select a value, this is how we display it
        return    <div className="simple-value">
                    <span className="memberaddform" style={{marginLeft: 10, verticalAlign: "middle"}}>{item.label}</span>
                </div>
    }

    static selectizeRenderValueLineBreak (item) {
        // When we select a value, this is how we display it
        return    <div className="simple-value">
                    <span className="accountchoice" >{item.label}</span>
                </div>
    }

    static selectizeNoResultsFound () {
        return    <div className="no-results-found" style={{fontSize: 15}}>
                    {__("Pas de résultat")}
                </div>
    }
}


module.exports = {
    checkStatus: checkStatus,
    parseJSON: parseJSON,
    checkSession: checkSession,
    fetchAuth: fetchAuth,
    fetchNoAuth: fetchNoAuth,
    fetchCustom: fetchCustom,
    fetchGetToken: fetchGetToken,
    getUrlParameter: getUrlParameter,
    isMemberIdEusko: isMemberIdEusko,
    isBdcIdEusko: isBdcIdEusko,
    isPositiveNumeric: isPositiveNumeric,
    titleCase: titleCase,
    getCurrentLang: getCurrentLang,
    getCSRFToken: getCSRFToken,
    getAPIBaseURL: getAPIBaseURL,
    SubNavbar: SubNavbar,
    Navbar: Navbar,
    NavbarItems: NavbarItems,
    TopbarRight: TopbarRight,
    SelectizeUtils: SelectizeUtils
}
