"""
Django settings for cel project.

Generated by 'django-admin startproject' using Django 1.10.5.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.10/ref/settings/
"""

import os

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'zktqn51mj2*w@ta+vhg!_eb^q1xjflpi2tx3+u*7_-%80^7@ep'

# SECURITY WARNING: don't run with debug turned on in production!
# You need to explicitly set DJANGO_DEBUG=True in docker-compose.yml (or environment variable) to have DEBUG on
DEBUG = os.environ.get('DJANGO_DEBUG', False)
if DEBUG and DEBUG in [True, 'true', 'True', 'yes', 'Yes']:
    DEBUG = True
else:
    DEBUG = False

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'base',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

MIDDLEWARE_CLASSES = [
    'csp.middleware.CSPMiddleware',

    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

AUTHENTICATION_BACKENDS = [
    'cel.auth.CELAuthBackend',
]


API_PUBLIC_URL = os.environ.get('API_PUBLIC_URL')
API_PUBLIC_URL += '' if API_PUBLIC_URL.endswith('/') else '/'

API_INTERNAL_URL = os.environ.get('API_INTERNAL_URL')
API_INTERNAL_URL += '' if API_INTERNAL_URL.endswith('/') else '/'

# CSP headers
CSP_DEFAULT_SRC = ["'self'"]
CSP_FONT_SRC = ["'self'", "http://fonts.gstatic.com"]
CSP_SCRIPT_SRC = ["'self'"]
CSP_IMG_SRC = ["'self'", "data: image:"]
CSP_STYLE_SRC = ["'self'", "'unsafe-inline'", "http://fonts.googleapis.com", "data: blob:"]
CSP_CONNECT_SRC = ["'self'", API_PUBLIC_URL, "http://localhost:8003", "http://localhost:8081"]

ROOT_URLCONF = 'cel.urls'

APPEND_SLASH = False
LOGIN_REDIRECT_URL = '/compte'
LOGIN_URL = '/login'
LOGOUT_URL = '/logout'

# TODO: Update CGU links
CGU_PDF_PARTICULIERS = 'http://particuliers.euskalmoneta.org/cgu.pdf'
CGU_PDF_PRESTATAIRES = 'http://prestataires.euskalmoneta.org/cgu.pdf'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(os.path.dirname(BASE_DIR), 'templates'),
                 os.path.join(os.path.dirname(BASE_DIR), 'adherents', 'templates'),
                 os.path.join(os.path.dirname(BASE_DIR), 'base', 'templates'),
                 os.path.join(os.path.dirname(BASE_DIR), 'cel', 'templates'), ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.i18n',
                'base.context_processors.get_django_settings',
            ],
        },
    },
]

# base.context_processors.get_django_settings needs it
TEMPLATE_VISIBLE_SETTINGS = ['API_PUBLIC_URL',
                             'CGU_PDF_PARTICULIERS', 'CGU_PDF_PRESTATAIRES',
                             'LOGIN_REDIRECT_URL', 'LOGIN_URL', 'LOGOUT_URL']

WSGI_APPLICATION = 'cel.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(os.path.dirname(BASE_DIR), 'db.sqlite3'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/1.10/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

TIME_ZONE = 'Europe/Paris'

USE_I18N = True

USE_L10N = True

USE_TZ = True

LANGUAGE_CODE = 'fr'

LANGUAGES = (
    ('fr', 'Francais'),
    ('eu', 'Euskara'),
)


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATIC_URL = '/static/'

STATICFILES_DIRS = (
    '/assets/',
    os.path.join(os.path.dirname(BASE_DIR), 'static'),
)
