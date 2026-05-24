window.addEventListener('componentsLoaded', function () {
    'use strict';

    var elLoading       = document.getElementById('loading');
    var elEmpty         = document.getElementById('empty-state');
    var elView          = document.getElementById('group-view');
    var elLeaderInfo    = document.getElementById('leader-info');
    var elMemberCount   = document.getElementById('member-count');
    var elActivity      = document.getElementById('activity-info');
    var elActivityName  = document.getElementById('activity-name');
    var elMembersList   = document.getElementById('members-list');
    var elLeaderActions = document.getElementById('leader-actions');
    var elInviteIcon    = document.getElementById('invite-icon');
    var elInviteLabel   = document.getElementById('invite-label');
    var elInviteHint    = document.getElementById('invite-hint');
    var elBtnToggle     = document.getElementById('btn-toggle-invite');
    var elBtnLeave      = document.getElementById('btn-leave');
    var elBtnCreate     = document.getElementById('btn-create');
    var elLeaveIcon     = document.getElementById('leave-icon');
    var elLeaveLabel    = document.getElementById('leave-label');

    var currentData = null;

    function setView(name) {
        elLoading.style.display = name === 'loading' ? 'flex' : 'none';
        elEmpty.style.display   = name === 'empty'   ? 'flex' : 'none';
        elView.style.display    = name === 'group'   ? ''     : 'none';
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function initial(name) {
        var s = String(name || '?').trim();
        return (s.charAt(0) || '?').toUpperCase();
    }

    function renderMembers(data) {
        elMembersList.innerHTML = '';
        var selfSrc = String(data.selfSrc);

        data.members.forEach(function (m) {
            var isSelf = String(m.src) === selfSrc;
            var row = document.createElement('div');
            row.className = 'member-item';

            var roleText = m.isLeader ? 'Leader' : 'Member';
            if (isSelf) roleText += ' · You';

            row.innerHTML =
                '<div class="member-avatar' + (m.isLeader ? ' is-leader' : '') + '">' +
                    escapeHtml(initial(m.name)) +
                '</div>' +
                '<div class="member-info">' +
                    '<div class="member-name">' + escapeHtml(m.name || 'Unknown') + '</div>' +
                    '<div class="member-role">' + escapeHtml(roleText) + '</div>' +
                '</div>' +
                '<div class="member-status ' + (m.online ? 'online' : 'offline') + '" ' +
                    'title="' + (m.online ? 'Online' : 'Offline') + '"></div>';

            if (data.isLeader && !isSelf) {
                var kick = document.createElement('button');
                kick.className = 'member-kick';
                kick.title = 'Kick';
                kick.innerHTML = '<span class="material-icons-outlined">person_remove</span>';
                kick.addEventListener('click', function () { confirmKick(m); });
                row.appendChild(kick);
            }

            elMembersList.appendChild(row);
        });
    }

    function renderGroup(data) {
        currentData = data;

        var leaderName = (data.leader && data.leader.name) || 'Unknown';
        elLeaderInfo.textContent = 'Leader: ' + leaderName;

        var count = data.membersCount || data.members.length;
        elMemberCount.textContent = count + ' member' + (count === 1 ? '' : 's');

        if (data.activity && data.activity.name) {
            elActivity.style.display = 'flex';
            elActivityName.textContent = data.activity.name;
        } else {
            elActivity.style.display = 'none';
        }

        renderMembers(data);

        if (data.isLeader) {
            elLeaderActions.style.display = '';
            if (data.isInviting) {
                elBtnToggle.classList.add('active');
                elInviteIcon.textContent = 'lock_open';
                elInviteLabel.textContent = 'Invites open - tap to close';
                elInviteHint.style.display = '';
            } else {
                elBtnToggle.classList.remove('active');
                elInviteIcon.textContent = 'person_add';
                elInviteLabel.textContent = 'Open for invites';
                elInviteHint.style.display = 'none';
            }
        } else {
            elLeaderActions.style.display = 'none';
        }

        if (data.isLeader) {
            elLeaveIcon.textContent = 'delete_forever';
            elLeaveLabel.textContent = 'Disband Group';
        } else {
            elLeaveIcon.textContent = 'logout';
            elLeaveLabel.textContent = 'Leave Group';
        }

        setView('group');
    }

    // Refresh without flashing the loading state - swap when the new data lands
    function refresh() {
        fetchNui('getGroupData', {}).then(function (data) {
            if (!data || !data.inGroup) {
                currentData = null;
                setView('empty');
                return;
            }
            renderGroup(data);
        });
    }

    function confirmKick(m) {
        setPopUp({
            type: 'confirm',
            title: 'Kick ' + (m.name || 'this member') + '?',
            description: 'They will be removed from the group immediately.',
            icon: 'person_remove',
            danger: true,
            confirmText: 'Kick',
            denyText: 'Cancel'
        }).then(function (r) {
            if (!r.confirmed) return;
            fetchNui('kickMember', { src: m.src });
        });
    }

    function confirmLeaveOrDisband() {
        if (!currentData) return;
        var isLeader = currentData.isLeader;

        setPopUp({
            type: 'confirm',
            title: isLeader ? 'Disband the group?' : 'Leave the group?',
            description: isLeader
                ? 'The group will be removed and everyone will be kicked out.'
                : 'You will leave this group and lose access to its activity.',
            icon: 'delete',
            danger: true,
            confirmText: isLeader ? 'Disband' : 'Leave',
            denyText: 'Cancel'
        }).then(function (r) {
            if (!r.confirmed) return;
            fetchNui('leaveGroup', {});
        });
    }

    elBtnCreate.addEventListener('click', function () { fetchNui('createGroup', {}); });
    elBtnLeave.addEventListener('click', confirmLeaveOrDisband);
    elBtnToggle.addEventListener('click', function () { fetchNui('toggleInviting', {}); });

    onNuiEvent('groupChanged',    function () { refresh(); });
    onNuiEvent('invitingChanged', function () { refresh(); });

    refresh();
});
