import {
    fetchAuth,
    titleCase,
    getAPIBaseURL,
    getCurrentLang,
    SelectizeUtils,
} from 'Utils'

import classNames from 'classnames'

const {
    Input,
    Row
} = FRC

import ReactSelectize from 'react-selectize'
const SimpleSelect = ReactSelectize.SimpleSelect

const {
    ToastContainer
} = ReactToastr
const ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation)

const AssociationForm = React.createClass({

    mixins: [FRC.ParentContextMixin],

    propTypes: {
        children: React.PropTypes.node
    },

    render() {
        return (
            <Formsy.Form
                className={this.getLayoutClassName()}
                {...this.props}
                ref="profil-form"
            >
                {this.props.children}
            </Formsy.Form>
        );
    }
})

const Association = React.createClass({

    getInitialState() {
        return {
            memberLogin: window.config.userName,
            member: null,
            canSubmit: false,
            validFields: false,
            fkAsso: '',
            fkAsso2: '',
            fkAssoAllList: undefined,
            fkAssoApprovedList: undefined,
            selectedOption: 0,
            otherAsso: false,
            fkAssoOther: '',
        }
    },

    componentDidMount() {

        var computeMemberData = (member) => {
            this.setState({member: member[0]})
            if(member[0]['array_options']['options_asso_saisie_libre']) {
                this.setState({fkAssoOther: member[0]['array_options']['options_asso_saisie_libre']})
                this.setState({selectedOption: 1})
                this.setState({otherAsso: true})
            }
            else
            {
                this.setState({selectedOption: 0})
                this.setState({otherAsso: false})
            }
        }
        fetchAuth(this.props.url + this.state.memberLogin, 'get', computeMemberData)
        // Get all associations (no filter): fkAssoAllList
        var computeAllAssociations = (associations) => {
            var res = _.chain(associations)
                .map(function(item){
                    if (item.nb_parrains == "0")
                        var label = item.nom + " – " + __("Aucun parrain")
                    else if (item.nb_parrains == "1")
                        var label = item.nom + " – " + item.nb_parrains + " " + __("parrain")
                    else
                        var label = item.nom + " – " + item.nb_parrains + " " + __("parrains")
                    return {label: label, value: item.id}
                })
                .sortBy(function(item){ return item.label })
                .value()

            this.setState({fkAssoAllList: res}, this.setAssoFromMember)
        }
        fetchAuth(getAPIBaseURL + "associations/", 'get', computeAllAssociations)

        // Get only approved associations: fkAssoApprovedList
        var computeApprovedAssociations = (associations) => {
            var res = _.chain(associations)
                .map(function(item){
                    if (item.nb_parrains == "0")
                        var label = item.nom + " – " + __("Aucun parrain")
                    else if (item.nb_parrains == "1")
                        var label = item.nom + " – " + item.nb_parrains + " " + __("parrain")
                    else
                        var label = item.nom + " – " + item.nb_parrains + " " + __("parrains")
                    return {label: label, value: item.id}
                })
                .sortBy(function(item){ return item.label })
                .value()

            this.setState({fkAssoApprovedList: res}, this.setAssoFromMember)
        }
        fetchAuth(getAPIBaseURL + "associations/?approved=yes", 'get', computeApprovedAssociations)
    },
    setAssoFromMember() {
        if (this.state.fkAssoAllList)
            var itemAsso = _.findWhere(this.state.fkAssoAllList, {value: this.state.member.fk_asso})

        if (this.state.fkAssoApprovedList)
            var itemAsso2 = _.findWhere(this.state.fkAssoApprovedList, {value: this.state.member.fk_asso2})

        this.setState({fkAsso: itemAsso, fkAsso2: itemAsso2})
    },
    // fkasso
    fkAssoOnValueChange(item) {
        if (item) {
            this.setState({fkAsso: item})
            // check if the first choice is an approved choice or not
            if(_.findWhere(this.state.fkAssoApprovedList, {value: item.value}))
            {
                this.setState({canSubmit: true})
            }
            else
            {
                if(this.state.fkAsso2)
                {
                    this.setState({canSubmit: true})
                }
                else
                {
                    this.setState({canSubmit: false})
                }
            }
        }
        else {
            this.setState({fkAsso: ''})
            this.setState({canSubmit: false})
        }
    },
    fkAssoOtherOnValueChange(event, value){
        if(value) {
            this.setState({fkAssoOther: value})
            if(this.state.fkAsso2)
            {
                this.setState({canSubmit: true})
            }
            else
            {
                this.setState({canSubmit: false})
            }
        }
        else{
            this.setState({fkAssoOther: ''})
            this.setState({canSubmit: false})
        }
    },
    // fkasso2
    fkAsso2OnValueChange(item) {
        if(item) {
           this.setState({fkAsso2: item}) 
           if(this.state.fkAsso || this.state.fkAssoOther)
           {
                this.setState({canSubmit: true})
           }
           else
           {
                this.setState({canSubmit: false})
           }
        }
        else
        {
            this.setState({fkAsso2: ''})
            if(this.state.fkAsso == '' || _.findWhere(this.state.fkAssoApprovedList, this.state.fkAsso) == undefined)
            {
                this.setState({canSubmit: false})
            }
        }
    },

    radioOnChange(event, value) {
        // update pin values
        if (event.target.value == 0)
        {
            this.setState({selectedOption: 0})
            this.setState({otherAsso: false})
            this.setState({fkAssoOther: ''})
            this.setState({canSubmit: false})
        }
        else if (event.target.value == 1)
        {
            this.setState({selectedOption: 1})
            this.setState({otherAsso: true})
            this.setState({fkAsso: ''})
            this.setState({canSubmit: false})
        }
    },


    submitForm() {
        this.setState({canSubmit: false})
        // We push fields into the data object that will be passed to the server
        var data = {}
        // We need to verify whether we are in "saisie libre" or not
        if(this.state.fkAsso.value) {
            data.fk_asso = this.state.fkAsso.value
        }
        else{
            data.fk_asso = this.state.fkAsso
        }
        if(this.state.fkAsso2.value) {
            data.fk_asso2 = this.state.fkAsso2.value
        }
        else{
            data.fk_asso2 = this.state.fkAsso2
        }
            
        data.options_asso_saisie_libre = this.state.fkAssoOther


        var computeForm = (data) => {
            this.refs.container.success(
                __("Les modifications ont bien été prises en compte."),
                "",
                {
                    timeOut: 3000,
                    extendedTimeOut: 10000,
                    closeButton:true
                }
            )
        }

        var promiseError = (err) => {
            // Error during request, or parsing NOK :(
            this.enableButton()

            console.log(this.props.url, err)
            this.refs.container.error(
                __("Une erreur s'est produite lors de l'enregistrement."),
                "",
                {
                    timeOut: 3000,
                    extendedTimeOut: 10000,
                    closeButton:true
                }
            )
        }
        fetchAuth(getAPIBaseURL + "members/" + this.state.member.id + "/", 'PATCH', computeForm, data, promiseError)
    },


    render() {
        var greySimpleSelect = classNames({
            'grey-back': this.state.otherAsso,
        })
        return (
                <div className="row">
                    <br/>
                    Chaque fois que vous changez des euros en eusko, 3% du montant de votre 
                    change est versé à l'association de votre choix. 
                    Par exemple, si vous changez 100 €, vous avez 100 eusko et Euskal Moneta 
                    reverse 3 eusko à l'association que vous parrainez.
                    Pour bénéficier de ce bonus de 3%, l'association doit être adhérente 
                    à Euskal Moneta et être parrainée par au moins 30 personnes.
                    <br/><br/>
                    Vous pouvez parrainer n'importe quelle association, y compris une association 
                    qui ne remplit pas les conditions pour recevoir les 3%. 
                    Dans ce cas, votre parrainage ira bien à cette assocation mais vous devez indiquer 
                    quelle association recevra vos 3% tant que la 1ère ne remplit pas les conditions.
                    <br/><br/>
                    Veuillez indiquer ci-dessous l'association que vous souhaitez parrainer.
                    <br/><br/><br/>
                    <AssociationForm ref="profil-form">
                        <fieldset>
                            <div className="form-group row">
                                <label
                                    className="control-label col-sm-4"
                                    data-required="true"
                                    htmlFor="profilform-asso">
                                    {__("Association parrainée - 1er choix :")}
                                </label>
                            </div>
                            Choisissez une association parmi les associations déjà adhérentes à Euskal Moneta :<br/><br/>
                            <div className="form-group row">
                                <div className="radio col-sm-1">
                                  <label>
                                    <input type="radio" value="0" checked={this.state.selectedOption == 0} onChange={this.radioOnChange}/>
                                  </label>
                                </div>
                                <div className="col-sm-5 profilform" data-eusko="profilform-asso">
                                    <SimpleSelect
                                        ref="select"
                                        value={this.state.fkAsso}
                                        options={this.state.fkAssoAllList}
                                        placeholder={__("Association 1")}
                                        theme="bootstrap3"
                                        onValueChange={this.fkAssoOnValueChange}
                                        renderValue={SelectizeUtils.selectizeRenderValue}
                                        renderOption={SelectizeUtils.selectizeNewRenderOption}
                                        onBlur={this.validateForm}
                                        renderNoResultsFound={SelectizeUtils.selectizeNoResultsFound}
                                        disabled={this.state.otherAsso}
                                        required={!this.state.otherAsso}
                                        className={greySimpleSelect}
                                    />
                                </div>
                            </div>
                            ou une autre association :<br/><br/>
                            <div className="form-group row">
                                <div className="radio col-sm-1">
                                  <label>
                                    <input type="radio" value="1" checked={this.state.selectedOption == 1} onChange={this.radioOnChange}/>
                                  </label>
                                </div>
                                <div className="col-sm-5" data-eusko="other-association">
                                    <Input
                                        name="asso_other"
                                        value={this.state.fkAssoOther}
                                        placeholder={__("Saisie libre d'une association")}
                                        readOnly={!this.state.otherAsso}
                                        required={this.state.otherAsso}
                                        onChange={this.fkAssoOtherOnValueChange}
                                        layout="elementOnly"
                                    />
                                </div>
                            </div>
                            <div className="form-group row">
                                <label
                                    className="control-label col-sm-4"
                                    data-required="true"
                                    htmlFor="profilform-asso2">
                                    {__("Association parrainée - 2nd choix :")}
                                </label>
                            </div>
                            Choisissez quelle association recevra les 3% de vos changes si la 1ère ne remplit pas les conditions pour :<br/><br/>
                            <div className="form-group row">
                                <div className="col-sm-5 col-md-offset-1 profilform" data-eusko="profilform-asso2">
                                    <SimpleSelect
                                        ref="select"
                                        value={this.state.fkAsso2}
                                        options={this.state.fkAssoApprovedList}
                                        placeholder={__("Association 2")}
                                        theme="bootstrap3"
                                        onValueChange={this.fkAsso2OnValueChange}
                                        renderOption={SelectizeUtils.selectizeRenderOption}
                                        renderValue={SelectizeUtils.selectizeRenderValue}
                                        onBlur={this.validateForm}
                                        renderNoResultsFound={SelectizeUtils.selectizeNoResultsFound}
                                    />
                                </div>
                            </div>
                        </fieldset>
                        <div className="row profil-div-margin-left margin-top">
                            <input
                                name="submit"
                                data-eusko="profil-form-submit"
                                type="submit"
                                defaultValue={__("Enregistrer")}
                                className="btn btn-success col-sm-offset-5"
                                formNoValidate={true}
                                onClick={() => this.submitForm()}
                                disabled={!this.state.canSubmit}
                            />
                        </div>
                    </AssociationForm>
                    <ToastContainer ref="container"
                        toastMessageFactory={ToastMessageFactory}
                        className="toast-top-right toast-top-right-navbar"
                    />
                </div>
            )
        }
    }
)

ReactDOM.render(
    <Association url={getAPIBaseURL + "members/?login="} postUrl={getAPIBaseURL + "members/"} />,
    document.getElementById('association')
)
document.title = __("Mon profil") + ": " + __("Association") + " - " + __("Compte en ligne") + " " + document.title
