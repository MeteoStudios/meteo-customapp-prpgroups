local function isPrpBridgeReady()
    return GetResourceState('prp-bridge') == 'started'
end

lib.callback.register('meteo-prpgroups:server:getGroupData', function(source)
    if not isPrpBridgeReady() then
        return { inGroup = false, error = 'prp-bridge not started' }
    end

    local ok, group = pcall(function()
        return exports['prp-bridge']:GetGroupFromMember(source)
    end)
    if not ok or not group then return { inGroup = false } end

    local leader = group.getLeader()
    local memberList = {}
    for _, m in pairs(group.getMembers()) do
        memberList[#memberList + 1] = {
            src = m.src,
            name = m.characterName,
            isLeader = m.isLeader,
            online = m.online,
        }
    end

    table.sort(memberList, function(a, b)
        if a.isLeader ~= b.isLeader then return a.isLeader end
        return (a.name or '') < (b.name or '')
    end)

    local isLeader = leader and tostring(leader.src) == tostring(source)
    local activity = group.getActivity()

    return {
        inGroup      = true,
        uuid         = group.getUuid(),
        isLeader     = isLeader or false,
        isInviting   = group.isInviting(),
        isLocked     = group.isLocked(),
        leader       = leader and { src = leader.src, name = leader.characterName } or nil,
        members      = memberList,
        membersCount = group.getMembersCount(),
        activity     = activity and { id = activity.activityId, name = activity.activityName } or nil,
        selfSrc      = source,
    }
end)

-- Use the export so prp-bridge's own create-group context menu doesn't open for the leader
RegisterNetEvent('meteo-prpgroups:server:createGroup', function()
    local src = source
    if not isPrpBridgeReady() then return end
    pcall(function() exports['prp-bridge']:CreateGroup(src) end)
end)

local function notifyGroupMembers(groupUuid, reason)
    if not groupUuid then return end
    local ok, group = pcall(function()
        return exports['prp-bridge']:GetGroupByUuid(groupUuid)
    end)
    if not ok or not group then return end

    for _, src in ipairs(group.getMembersPlayerIds()) do
        TriggerClientEvent('meteo-prpgroups:client:groupChanged', src, reason)
    end
end

AddEventHandler('prp-bridge:server:groupMemberAdded', function(src, groupUuid)
    notifyGroupMembers(groupUuid, 'memberAdded')
end)

AddEventHandler('prp-bridge:server:groupMemberRemoved', function(src, groupUuid)
    notifyGroupMembers(groupUuid, 'memberRemoved')
    -- The removed player isn't in the group anymore, push to them directly
    TriggerClientEvent('meteo-prpgroups:client:groupChanged', src, 'youLeft')
end)

AddEventHandler('prp-bridge:server:groupDisbanded', function(groupUuid)
    notifyGroupMembers(groupUuid, 'disbanded')
end)
