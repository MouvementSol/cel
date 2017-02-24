from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render


@login_required
def index(request):
    return redirect('overview')


def first_time(request):
    return render(request, 'adherents/first-time.html')


def valid_first_time(request):
    return render(request, 'adherents/valid-token.html')


def lost_password(request):
    return render(request, 'adherents/lost-password.html')


def valid_lost_password(request):
    return render(request, 'adherents/valid-token.html')


@login_required
def profile_home(request):
    return redirect('profile')


@login_required
def profile(request):
    return render(request, 'adherents/index.html')


@login_required
def compte_home(request):
    return redirect('overview')


@login_required
def overview(request):
    return render(request, 'adherents/overview.html')


@login_required
def history(request):
    return render(request, 'adherents/history.html')


@login_required
def virements_home(request):
    return redirect('virements-ponctuel')


@login_required
def virements_beneficiaires(request):
    return render(request, 'adherents/virements-beneficiaires.html')


@login_required
def virements_ponctuel(request):
    return render(request, 'adherents/virements-ponctuel.html')


@login_required
def euskokart(request):
    return render(request, 'adherents/euskokart.html')


@login_required
def overview_reconvertir(request):
    return render(request, 'adherents/overview-reconvertir.html')


@login_required
def compte_recharger(request):
    return render(request, 'adherents/compte-recharger.html')
