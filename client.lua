local IDENTIFIER = 'meteoprpgroups'
local registered = false

local function isPrpBridgeReady()
    return GetResourceState('prp-bridge') == 'started'
end

local function registerApp()
    if registered or not isPrpBridgeReady() then return end

    exports['meteo-phone']:AddCustomApp({
        identifier = IDENTIFIER, -- must be unique
        name = 'Groups',
        description = 'View your party and manage members',
        developer = 'Meteo Studios',
        ui = 'ui/index.html',
        materialIcon = 'groups',
        iconBackground = 'linear-gradient(135deg, #4B89DB 0%, #2C5BA3 100%)',
        defaultApp = false,
        size = 0.4,
    })
    registered = true
end

local function unregisterApp()
    if not registered then return end
    exports['meteo-phone']:RemoveCustomApp(IDENTIFIER)
    registered = false
end

AddEventHandler('onClientResourceStart', function(res)
    if res == GetCurrentResourceName() or res == 'prp-bridge' then
        registerApp()
    end
end)
AddEventHandler('meteo-phone:customAppsReady', registerApp)

AddEventHandler('onClientResourceStop', function(res)
    if res == 'prp-bridge' then unregisterApp() end
end)

RegisterNUICallback('getGroupData', function(data, cb)
    local result = lib.callback.await('meteo-prpgroups:server:getGroupData', false)
    cb(result or { inGroup = false })
end)

-- Routed through our server so prp-bridge's own context menu doesn't pop up
RegisterNUICallback('createGroup', function(data, cb)
    TriggerServerEvent('meteo-prpgroups:server:createGroup')
    cb({ ok = true })
end)

RegisterNUICallback('leaveGroup', function(data, cb)
    TriggerServerEvent('prp-bridge:server:groupLeave')
    cb({ ok = true })
end)

RegisterNUICallback('toggleInviting', function(data, cb)
    TriggerServerEvent('prp-bridge:server:toggleGroupsInviting')
    cb({ ok = true })
end)

RegisterNUICallback('kickMember', function(data, cb)
    if data and data.src then
        TriggerServerEvent('prp-bridge:server:groupKick', data.src)
    end
    cb({ ok = true })
end)

local function notifyApp(event, payload)
    if not registered then return end
    exports['meteo-phone']:SendCustomAppMessage(IDENTIFIER, event, payload or {})
end

RegisterNetEvent('meteo-prpgroups:client:groupChanged', function(reason)
    notifyApp('groupChanged', { reason = reason })
end)

-- Must be RegisterNetEvent (not AddEventHandler) for this resource to receive it
RegisterNetEvent('prp-bridge:client:toggleGroupInviting', function(state)
    notifyApp('invitingChanged', { state = state and true or false })
end)
