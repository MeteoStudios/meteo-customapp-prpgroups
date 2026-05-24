fx_version 'cerulean'
game 'gta5'

name 'meteo-customapp-prpgroups'
description 'Groups app for Prodigy Studios scripts'
author 'Meteo Studios'
version '1.0.0'

shared_scripts {
    '@ox_lib/init.lua',
}

client_script 'client.lua'
server_script 'server.lua'

files {
    'ui/index.html',
    'ui/app.js',
    'ui/app.css',
}

lua54 'yes'