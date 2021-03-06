import {
    fetchAuth,
    getAPIBaseURL,
    SelectizeUtils,
} from 'Utils'

import ModalEusko from 'Modal'

const {
    Input,
    Row,
} = FRC

import ReactSelectize from 'react-selectize'
const SimpleSelect = ReactSelectize.SimpleSelect

const {
    ToastContainer,
} = ReactToastr
const ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation)

const ReconversionForm = React.createClass({

    mixins: [FRC.ParentContextMixin],

    propTypes: {
        children: React.PropTypes.node
    },

    render() {
        return (
            <Formsy.Form
                className={this.getLayoutClassName()}
                {...this.props}
                ref="reconversion-form"
            >
                {this.props.children}
            </Formsy.Form>
        );
    }
})

var Ponctuel = React.createClass({
    getInitialState() {
        return {
            isModalOpen: false,
            canSubmit: false,
            debit: {    
                label: undefined,
                value: undefined,
            },
            debitList: Array(),
            credit: undefined,
            amount: '',
            description: '',
        }
    },
    openModal() {
        this.setState({isModalOpen: true})
    },

    hideModal() {
        this.setState({isModalOpen: false})
    },

    getModalElements(modalMode, amount=null) {
        if (modalMode == 'delete') {
            var modalBody = <p>{__("Etes-vous sûr de vouloir reconvertir %%%% eusko en € ?").replace('%%%%', amount)}</p>
            var modalTitle = __("Reconversion d'eusko en € - Confirmation")
            var validateLabel = __("Confirmer")
        }
        this.setState({modalBody: modalBody, modalMode: modalMode,
                       modalTitle: modalTitle, validateLabel: validateLabel}, this.openModal)
    },

    componentDidMount() {
        var computeDebitList = (data) => {
            var res = _.chain(data.result)
                .map((item) => { return {label: item.number, value:item.owner.id} })
                .sortBy((item) => { return item.label })
                .value()

            if (_.isEmpty(res))
                var state = {debitList: res}
            else
                var state = {debitList: res, debit: res[0]}

            this.setState(state)
        }
        fetchAuth(getAPIBaseURL + "account-summary-adherents/", 'GET', computeDebitList)
    },

    debitOnValueChange(item) {
        if (item)
            this.setState({debit: item})
        else
            this.setState({debit: undefined})
    },

    amountOnValueChange(event, value) {
        var amount = value.replace('.', ',')
        this.setState({amount: amount}, this.validateForm)
    },

    descriptionOnValueChange(event, value) {
        this.setState({description: value}, this.validateForm)
    },

    enableButton() {
        this.setState({canSubmit: true})
    },

    disableButton() {
        this.setState({canSubmit: false})
    },

    validateForm() {
        if (this.state.debit && this.state.amount && this.state.description)
            this.enableButton()
        else
            this.disableButton()
    },

    submitForm() {
        this.disableButton()

        // We push fields into the data object that will be passed to the server
        var data = {debit: this.state.debit.value,
                    amount: this.state.amount.replace(',', '.'),
                    description: this.state.description
        }
        var computeForm = (data) => {
            this.hideModal()
            this.refs.container.success(
                __("La reconversion a bien été enregistrée."),
                "",
                {
                    timeOut: 3000,
                    extendedTimeOut: 10000,
                    closeButton:true
                }
            )

            setTimeout(() => window.location.assign("/compte/synthese"), 5000)
        }

        var promiseError = (err) => {
            // Error during request, or parsing NOK :(
            this.enableButton()
            this.hideModal()
            console.log(this.props.url, err)
            this.refs.container.error(
                __("Une erreur s'est produite lors de la reconversion, vérifiez le solde de votre compte !"),
                "",
                {
                    timeOut: 3000,
                    extendedTimeOut: 10000,
                    closeButton:true
                }
            )
        }
        fetchAuth(getAPIBaseURL + "reconvert-eusko/", 'POST', computeForm, data, promiseError)
    },

    validateReconvert(amount) {
        this.getModalElements('delete', amount)
    },

    render() {
        var debitData = null
        if (this.state.debitList.length == 1)
        {
            var debitData = (
                <div className="form-group row">
                    <label
                        className="control-label col-sm-2 col-md-offset-1"
                        htmlFor="reconversion-debit"
                        style={{paddingTop:10}}>
                        {__("Compte à débiter")}
                    </label>
                    <div className="col-sm-3 reconversion-debit" data-eusko="reconversion-debit">
                        <label className="control-label" style={{fontWeight: 'normal'}}>
                            {this.state.debit.label}
                        </label>
                    </div>
                </div>
            )
        }
        else if (this.state.debitList.length > 1)
        {
            var debitData = (
                <div className="form-group row">
                    <div className="col-sm-1"></div>
                    <label
                        className="control-label col-sm-2"
                        htmlFor="reconversion-debit"
                        style={{paddingTop:10}}>
                        {__("Compte à débiter")}
                        <span className="required-symbol">&nbsp;*</span>
                    </label>
                    <div className="col-sm-1"></div>
                    <div className="col-sm-4 reconversion-debit" data-eusko="reconversion-debit">
                        <SimpleSelect
                            ref="select"
                            value={this.state.debit}
                            options={this.state.debitList}
                            placeholder={__("Compte à débiter")}
                            theme="bootstrap3"
                            autocomplete="off"
                            onValueChange={this.debitOnValueChange}
                            renderValue={SelectizeUtils.selectizeRenderValue}
                            renderOption={SelectizeUtils.selectizeNewRenderOption}
                            onBlur={this.validateForm}
                            required
                        >
                        </SimpleSelect>
                    </div>
                </div>
            )
        }

        return (
            <div className="row">
                <div className="col-md-10 col-md-offset-1">
                    <ReconversionForm ref="reconversion-form">
                        {debitData}
                        <Input
                            name="montant"
                            label={__("Montant en eusko")}
                            placeholder={__("Montant de la reconversion")}
                            data-eusko="reconversion-amount"
                            onChange={this.amountOnValueChange}
                            value = {this.state.amount}
                            type="text"
                            validations={{
                                matchRegexp: /^\d+(,\d{1,2})?$/
                            }}
                            validationErrors={{
                                matchRegexp: __("Montant invalide.")
                            }}
                            elementWrapperClassName={[{'col-sm-9': false}, 'col-sm-3']}
                            required
                        />
                        <Input
                            name="description"
                            label={__("Description")}
                            placeholder={__("Description de la reconversion")}
                            type="text"
                            validations="isExisty"
                            validationErrors={{
                               isExisty: __("Montant invalide.")
                            }}
                            elementWrapperClassName={[{'col-sm-9': false}, 'col-sm-3']}
                            data-eusko="reconversion-description"
                            onChange={this.descriptionOnValueChange}
                            value = {this.state.description}
                            required
                        />
                        <Row layout="horizontal">
                            <input
                                name="submit"
                                data-eusko="one-time-transfer-form-submit"
                                type="submit"
                                defaultValue={__("Valider")}
                                className="btn btn-success"
                                formNoValidate={true}
                                onClick={() => this.validateReconvert(this.state.amount)}
                                disabled={!this.state.canSubmit}
                            />
                        </Row>
                    </ReconversionForm>
                </div>
                <ToastContainer ref="container"
                    toastMessageFactory={ToastMessageFactory}
                    className="toast-top-right toast-top-right-navbar"
                />
                <ModalEusko hideModal={this.hideModal}
                            isModalOpen={this.state.isModalOpen}
                            modalBody={this.state.modalBody}
                            modalTitle={this.state.modalTitle}
                            validateLabel={this.state.validateLabel}
                            onValidate={this.submitForm}
                            staticContent={true}
                            btnValidateClass="btn-success"
                            btnValidateEnabled={true}
                            />
            </div>
        )
    }
})


ReactDOM.render(
    <Ponctuel ponctuelListUrl={getAPIBaseURL + "beneficiaires/"} />,
    document.getElementById('reconvert')
)
document.title = __("Mon compte") + ": " + __("Reconversion") + " - " + __("Compte en ligne") + " " + document.title
