(function() {
    const field = document.querySelector('.field');
    const playersMenu = document.querySelector('.players-container');
    const resetBtn = document.querySelector('.btn-container button:first-child');
    const defaultBtn = document.querySelector('.btn-container button:last-child');
    
    let playersOnField = [];
    let ballsOnField = [];
    let activeCustomPlayer = null;
    let customEditorPanel = null;
    
    let draggedOriginal = null;
    let draggedClone = null;
    let isDragging = false;
    let startClientX = 0, startClientY = 0;
    let isFromMenu = false;
    let hasMoved = false;
    let isDraggingBall = false;
    
    function getPlayerType(element) {
        if (element.classList.contains('s')) return 'S';
        if (element.classList.contains('op')) return 'OP';
        if (element.classList.contains('oh')) return 'OH';
        if (element.classList.contains('mb')) return 'MB';
        if (element.classList.contains('l')) return 'L';
        if (element.classList.contains('custom')) return 'CUSTOM';
        return 'OH';
    }
    
    function getPlayerColor(type) {
        switch(type) {
            case 'S': return 'var(--s-color, #ff3300)';
            case 'OP': return 'var(--op-color, #ff0077)';
            case 'OH': return 'var(--oh-color, #008cff)';
            case 'MB': return 'var(--mb-color, #ffe600)';
            case 'L': return 'var(--l-color, #00fd00)';
            case 'CUSTOM': return 'var(--custom-color, #9b59b6)';
            default: return '#ff0000';
        }
    }
    
    function getPlayerTextColor(type) {
        if (type === 'CUSTOM') {
            return 'white';
        }
        switch(type) {
            case 'S': return 'black';
            case 'OP': return 'black';
            case 'OH': return 'white';
            case 'MB': return 'black';
            case 'L': return 'black';
            default: return 'black';
        }
    }
    
    function getPlayerText(type, customName = null) {
        if (type === 'CUSTOM') {
            return customName || 'N/A';
        }
        switch(type) {
            case 'S': return 'С';
            case 'OP': return 'Диг';
            case 'OH': return 'Д';
            case 'MB': return 'ЦБ';
            case 'L': return 'Л';
            default: return '?';
        }
    }
    
    function showCustomEditor(player) {
        if (customEditorPanel) {
            customEditorPanel.remove();
            customEditorPanel = null;
        }
        
        const rect = player.getBoundingClientRect();
        const fieldRect = field.getBoundingClientRect();
        
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.left = (rect.left + 60) + 'px';
        panel.style.top = (rect.top - 20) + 'px';
        panel.style.backgroundColor = 'white';
        panel.style.borderRadius = '12px';
        panel.style.padding = '10px';
        panel.style.zIndex = '300';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.gap = '4px';
        panel.style.width = '200px';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Имя игрока';
        nameInput.style.backgroundColor = "white";
        nameInput.value = player.getAttribute('data-custom-name') || player.textContent;
        nameInput.maxLength = 12;
        nameInput.style.padding = '6px';
        nameInput.style.fontSize = '12px';
        nameInput.style.color = "black";
        nameInput.style.borderRadius = '6px';
        nameInput.style.border = '1px solid #ccc';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.marginTop = '5px';
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Сохранить';
        saveBtn.style.padding = '5px 10px';
        saveBtn.style.backgroundColor = '#00ff22';
        saveBtn.style.color = 'black';
        saveBtn.style.border = 'none';
        saveBtn.style.cursor = 'pointer';
        saveBtn.style.fontSize = '12px';
        saveBtn.style.fontWeight = "400";
        saveBtn.style.borderRadius = '6px';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Удалить';
        deleteBtn.style.padding = '5px 10px';
        deleteBtn.style.backgroundColor = '#ff1900';
        deleteBtn.style.color = 'black';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '12px';
        deleteBtn.style.fontWeight = "400";
        deleteBtn.style.borderRadius = '6px';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Отмена';
        cancelBtn.style.padding = '5px 10px';
        cancelBtn.style.backgroundColor = '#dddddd';
        cancelBtn.style.color = 'black';
        cancelBtn.style.border = 'none';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.fontSize = '12px';
        cancelBtn.style.fontWeight = "400";
        cancelBtn.style.borderRadius = '6px';
        
        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(deleteBtn);
        buttonContainer.appendChild(cancelBtn);
        
        panel.appendChild(nameInput);
        panel.appendChild(buttonContainer);
        
        function closePanel() {
            if (panel && panel.parentNode) {
                panel.remove();
                customEditorPanel = null;
                activeCustomPlayer = null;
            }
        }
        
        saveBtn.addEventListener('click', () => {
            const newName = nameInput.value.trim();
            
            if (newName) {
                player.textContent = newName;
                player.setAttribute('data-custom-name', newName);
            } else {
                player.textContent = 'N/A';
                player.setAttribute('data-custom-name', 'N/A');
            }
            
            closePanel();
        });
        
        deleteBtn.addEventListener('click', () => {
            removePlayerFromField(player);
            closePanel();
        });
        
        cancelBtn.addEventListener('click', closePanel);
        
        setTimeout(() => {
            document.addEventListener('click', function onClickOutside(e) {
                if (panel && !panel.contains(e.target) && e.target !== player) {
                    closePanel();
                    document.removeEventListener('click', onClickOutside);
                }
            });
        }, 10);
        
        document.body.appendChild(panel);
        customEditorPanel = panel;
        activeCustomPlayer = player;
    }
    
    function createBall(leftPx, topPx) {
        const ball = document.createElement('img');
        ball.className = 'ball-on-field';
        ball.style.position = 'absolute';
        ball.style.left = leftPx + 'px';
        ball.style.top = topPx + 'px';
        ball.style.width = '30px';
        ball.style.height = '30px';
        ball.style.borderRadius = '50%';
        ball.style.cursor = 'grab';
        ball.style.zIndex = '90';
        ball.style.objectFit = 'cover';
        ball.src = "favicon.png";
        
        attachBallDragHandlers(ball);
        
        ball.addEventListener('click', (e) => {
            e.stopPropagation();
            removeBallFromField(ball);
        });
        
        return ball;
    }
    
    function attachBallDragHandlers(ball) {
        ball.removeEventListener('mousedown', onBallPointerDown);
        ball.removeEventListener('touchstart', onBallPointerDown);
        ball.addEventListener('mousedown', onBallPointerDown);
        ball.addEventListener('touchstart', onBallPointerDown, { passive: false });
    }
    
    function onBallPointerDown(e) {
        e.stopPropagation();
        
        let clientX, clientY;
        if (e.clientX !== undefined) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            return;
        }
        
        draggedOriginal = e.target.closest('.ball-on-field, .ball');
        if (!draggedOriginal) return;
        
        isDragging = false;
        isDraggingBall = true;
        hasMoved = false;
        startClientX = clientX;
        startClientY = clientY;
        
        isFromMenu = playersMenu.contains(draggedOriginal);
        
        document.addEventListener('mousemove', onBallPointerMove);
        document.addEventListener('mouseup', onBallPointerUp);
        document.addEventListener('touchmove', onBallPointerMove, { passive: false });
        document.addEventListener('touchend', onBallPointerUp);
    }
    
    function onBallPointerMove(e) {
        if (!draggedOriginal) return;
        
        let clientX, clientY;
        if (e.clientX !== undefined) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            return;
        }
        
        const moveX = Math.abs(clientX - startClientX);
        const moveY = Math.abs(clientY - startClientY);
        
        if (!hasMoved && (moveX > 5 || moveY > 5)) {
            hasMoved = true;
            isDragging = true;
            
            if (customEditorPanel) {
                customEditorPanel.remove();
                customEditorPanel = null;
                activeCustomPlayer = null;
            }
            
            const rect = draggedOriginal.getBoundingClientRect();
            draggedClone = draggedOriginal.cloneNode(true);
            draggedClone.style.position = 'fixed';
            draggedClone.style.left = rect.left + 'px';
            draggedClone.style.top = rect.top + 'px';
            draggedClone.style.width = rect.width + 'px';
            draggedClone.style.height = rect.height + 'px';
            draggedClone.style.margin = '0';
            draggedClone.style.opacity = '0.8';
            draggedClone.style.zIndex = '9999';
            draggedClone.style.cursor = 'grabbing';
            draggedClone.style.pointerEvents = 'none';
            document.body.appendChild(draggedClone);
            
            e.preventDefault();
        }
        
        if (isDragging && draggedClone) {
            e.preventDefault();
            draggedClone.style.left = (clientX - draggedClone.offsetWidth / 2) + 'px';
            draggedClone.style.top = (clientY - draggedClone.offsetHeight / 2) + 'px';
        }
    }
    
    function onBallPointerUp(e) {
        if (!draggedOriginal) {
            cleanupBall();
            return;
        }
        
        if (isDragging && hasMoved) {
            let clientX, clientY;
            if (e.clientX !== undefined) {
                clientX = e.clientX;
                clientY = e.clientY;
            } else if (e.changedTouches) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else {
                cleanupBall();
                return;
            }
            
            if (isInField(clientX, clientY)) {
                const coords = getValidBallCoords(clientX, clientY);
                
                const isFromMenuBall = isFromMenu && draggedOriginal.classList.contains('ball');
                
                if (isFromMenuBall) {
                    const newBall = createBall(coords.left, coords.top);
                    field.appendChild(newBall);
                    ballsOnField.push(newBall);
                } else if (draggedOriginal.classList.contains('ball-on-field')) {
                    draggedOriginal.style.left = coords.left + 'px';
                    draggedOriginal.style.top = coords.top + 'px';
                }
            }
        }
        
        cleanupBall();
    }
    
    function getValidBallCoords(clientX, clientY) {
        const fieldRect = field.getBoundingClientRect();
        let left = clientX - fieldRect.left - 15;
        let top = clientY - fieldRect.top - 15;
        
        const minX = 5;
        const maxX = fieldRect.width - 35;
        const minY = 5;
        const maxY = fieldRect.height - 35;
        
        left = Math.max(minX, Math.min(left, maxX));
        top = Math.max(minY, Math.min(top, maxY));
        
        return { left, top };
    }
    
    function cleanupBall() {
        if (draggedClone) {
            draggedClone.remove();
            draggedClone = null;
        }
        draggedOriginal = null;
        isDragging = false;
        hasMoved = false;
        isDraggingBall = false;
        
        document.removeEventListener('mousemove', onBallPointerMove);
        document.removeEventListener('mouseup', onBallPointerUp);
        document.removeEventListener('touchmove', onBallPointerMove);
        document.removeEventListener('touchend', onBallPointerUp);
    }
    
    function removeBallFromField(ball) {
        if (ball && ball.parentNode === field) {
            ball.remove();
            ballsOnField = ballsOnField.filter(b => b !== ball);
        }
    }
    
    function createFieldPlayer(type, leftPx, topPx, customName = null) {
        const player = document.createElement('div');
        const typeLower = type === 'CUSTOM' ? 'custom' : type.toLowerCase();
        player.className = `player ${typeLower}`;
        player.textContent = getPlayerText(type, customName);
        
        if (type === 'CUSTOM') {
            if (customName) player.setAttribute('data-custom-name', customName);
        }
        
        player.style.position = 'absolute';
        player.style.left = leftPx + 'px';
        player.style.top = topPx + 'px';
        player.style.width = '50px';
        player.style.height = '50px';
        player.style.borderRadius = '50%';
        player.style.display = 'flex';
        player.style.alignItems = 'center';
        player.style.justifyContent = 'center';
        if (type === 'CUSTOM') {
            player.style.fontSize = '8px';
            player.style.fontWeight = '800';
        } else {
            player.style.fontSize = '11px';
            player.style.fontWeight = '800';
        }
        player.style.color = getPlayerTextColor(type);
        player.style.cursor = 'grab';
        player.style.zIndex = '100';
        player.style.userSelect = 'none';
        player.style.backgroundColor = getPlayerColor(type);
        player.style.textAlign = 'center';
        player.style.wordBreak = 'break-word';
        player.style.padding = '5px';
        
        attachDragHandlers(player);
        
        player.addEventListener('click', (e) => {
            e.stopPropagation();
            if (type === 'CUSTOM') {
                showCustomEditor(player);
            } else {
                removePlayerFromField(player);
            }
        });
        
        return player;
    }
    
    function removePlayerFromField(player) {
        if (player && player.parentNode === field) {
            if (activeCustomPlayer === player && customEditorPanel) {
                customEditorPanel.remove();
                customEditorPanel = null;
                activeCustomPlayer = null;
            }
            player.remove();
            playersOnField = playersOnField.filter(p => p !== player);
        }
    }
    
    function addPlayerToField(type, leftPx, topPx, customName = null) {
        const newPlayer = createFieldPlayer(type, leftPx, topPx, customName);
        field.appendChild(newPlayer);
        playersOnField.push(newPlayer);
        return newPlayer;
    }
    
    function isInField(clientX, clientY) {
        const fieldRect = field.getBoundingClientRect();
        if (!fieldRect || fieldRect.width === 0) return false;
        return clientX >= fieldRect.left && 
               clientX <= fieldRect.right && 
               clientY >= fieldRect.top && 
               clientY <= fieldRect.bottom;
    }
    
    function getValidFieldCoords(clientX, clientY) {
        const fieldRect = field.getBoundingClientRect();
        let left = clientX - fieldRect.left - 25;
        let top = clientY - fieldRect.top - 25;
        
        const minX = 5;
        const maxX = fieldRect.width - 55;
        const minY = 5;
        const maxY = fieldRect.height - 55;
        
        left = Math.max(minX, Math.min(left, maxX));
        top = Math.max(minY, Math.min(top, maxY));
        
        return { left, top };
    }
    
    function onPointerDown(e) {
        const targetPlayer = e.target.closest('.player');
        
        if (!targetPlayer) {
            if (customEditorPanel) {
                customEditorPanel.remove();
                customEditorPanel = null;
                activeCustomPlayer = null;
            }
            return;
        }
        
        let clientX, clientY;
        if (e.clientX !== undefined) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            return;
        }
        
        draggedOriginal = targetPlayer;
        isDragging = false;
        hasMoved = false;
        startClientX = clientX;
        startClientY = clientY;
        
        isFromMenu = playersMenu.contains(draggedOriginal);
        
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('touchend', onPointerUp);
    }
    
    function onPointerMove(e) {
        if (!draggedOriginal) return;
        
        let clientX, clientY;
        if (e.clientX !== undefined) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            return;
        }
        
        const moveX = Math.abs(clientX - startClientX);
        const moveY = Math.abs(clientY - startClientY);
        
        if (!hasMoved && (moveX > 5 || moveY > 5)) {
            hasMoved = true;
            isDragging = true;
            
            if (customEditorPanel) {
                customEditorPanel.remove();
                customEditorPanel = null;
                activeCustomPlayer = null;
            }
            
            const rect = draggedOriginal.getBoundingClientRect();
            draggedClone = draggedOriginal.cloneNode(true);
            draggedClone.style.position = 'fixed';
            draggedClone.style.left = rect.left + 'px';
            draggedClone.style.top = rect.top + 'px';
            draggedClone.style.width = rect.width + 'px';
            draggedClone.style.height = rect.height + 'px';
            draggedClone.style.margin = '0';
            draggedClone.style.opacity = '0.8';
            draggedClone.style.zIndex = '9999';
            draggedClone.style.cursor = 'grabbing';
            draggedClone.style.pointerEvents = 'none';
            document.body.appendChild(draggedClone);
            
            draggedOriginal.style.opacity = '0.3';
            
            e.preventDefault();
        }
        
        if (isDragging && draggedClone) {
            e.preventDefault();
            draggedClone.style.left = (clientX - draggedClone.offsetWidth / 2) + 'px';
            draggedClone.style.top = (clientY - draggedClone.offsetHeight / 2) + 'px';
        }
    }
    
    function onPointerUp(e) {
        if (!draggedOriginal) {
            cleanup();
            return;
        }
        
        if (isDragging && hasMoved) {
            let clientX, clientY;
            if (e.clientX !== undefined) {
                clientX = e.clientX;
                clientY = e.clientY;
            } else if (e.changedTouches) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else {
                cleanup();
                return;
            }
            
            if (isInField(clientX, clientY)) {
                const coords = getValidFieldCoords(clientX, clientY);
                
                if (isFromMenu) {
                    const playerType = getPlayerType(draggedOriginal);
                    if (playerType === 'CUSTOM') {
                        addPlayerToField('CUSTOM', coords.left, coords.top, 'N/A');
                    } else {
                        addPlayerToField(playerType, coords.left, coords.top);
                    }
                } else {
                    draggedOriginal.style.left = coords.left + 'px';
                    draggedOriginal.style.top = coords.top + 'px';
                }
            }
        }
        
        cleanup();
    }
    
    function cleanup() {
        if (draggedClone) {
            draggedClone.remove();
            draggedClone = null;
        }
        if (draggedOriginal) {
            draggedOriginal.style.opacity = '1';
            draggedOriginal = null;
        }
        isDragging = false;
        hasMoved = false;
        
        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('touchend', onPointerUp);
    }
    
    function attachDragHandlers(element) {
        element.removeEventListener('mousedown', onPointerDown);
        element.removeEventListener('touchstart', onPointerDown);
        element.addEventListener('mousedown', onPointerDown);
        element.addEventListener('touchstart', onPointerDown, { passive: false });
    }
    
    function initMenuPlayers() {
        const menuPlayers = document.querySelectorAll('.players-container .player');
        menuPlayers.forEach(player => {
            player.style.cursor = 'grab';
            player.style.position = 'relative';
            player.style.userSelect = 'none';
            player.style.touchAction = 'manipulation';
            attachDragHandlers(player);
        });
        
        const menuBall = document.querySelector('.players-container .ball');
        if (menuBall) {
            menuBall.style.cursor = 'grab';
            menuBall.style.userSelect = 'none';
            menuBall.style.touchAction = 'manipulation';
            menuBall.style.width = '40px';
            menuBall.style.height = '40px';
            menuBall.style.borderRadius = '50%';
            menuBall.style.objectFit = 'cover';
            attachBallDragHandlers(menuBall);
        }
    }
    
    function resetField() {
        playersOnField.forEach(player => {
            if (player && player.parentNode === field) {
                player.remove();
            }
        });
        playersOnField = [];
        
        ballsOnField.forEach(ball => {
            if (ball && ball.parentNode === field) {
                ball.remove();
            }
        });
        ballsOnField = [];
        
        if (customEditorPanel) {
            customEditorPanel.remove();
            customEditorPanel = null;
            activeCustomPlayer = null;
        }
    }
    
    function setDefaultFormation() {
        resetField();
        
        const trySet = () => {
            const fieldRect = field.getBoundingClientRect();
            const width = fieldRect.width;
            const height = fieldRect.height;
            
            if (width === 0 || height === 0) {
                setTimeout(trySet, 50);
                return;
            }
            
            const centerY = height / 2;
            const frontOffset = 65;
            const backOffset = 130;
            
            const topFrontY = centerY - frontOffset;
            const topBackY = centerY - backOffset;
            const bottomFrontY = centerY + frontOffset;
            const bottomBackY = centerY + backOffset;
            
            const leftX = width * 0.18;
            const centerX = width * 0.5;
            const rightX = width * 0.82;
            
            addPlayerToField('OH', leftX - 25, bottomFrontY - 25);
            addPlayerToField('MB', centerX - 25, bottomFrontY - 25);
            addPlayerToField('OP', rightX - 25, bottomFrontY - 25);
            addPlayerToField('OH', leftX - 25, bottomBackY - 25);
            addPlayerToField('L', centerX - 25, bottomBackY - 25);
            addPlayerToField('S', rightX - 25, bottomBackY - 25);
            
            addPlayerToField('OH', rightX - 25, topFrontY - 25);
            addPlayerToField('MB', centerX - 25, topFrontY - 25);
            addPlayerToField('OP', leftX - 25, topFrontY - 25);
            addPlayerToField('OH', rightX - 25, topBackY - 25);
            addPlayerToField('L', centerX - 25, topBackY - 25);
            addPlayerToField('S', leftX - 25, topBackY - 25);
        };
        
        setTimeout(trySet, 50);
    }
    
    function setupMenuObserver() {
        const observer = new MutationObserver(() => {
            initMenuPlayers();
        });
        observer.observe(playersMenu, { childList: true, subtree: true });
    }
    
    function initField() {
        field.style.position = 'relative';
        field.style.overflow = 'auto';
        field.style.webkitOverflowScrolling = 'touch';
        
        const style = document.createElement('style');
        style.textContent = `
            .field {
                overflow: auto;
                -webkit-overflow-scrolling: touch;
            }
            .field .player {
                cursor: grab;
                touch-action: none;
                will-change: left, top;
            }
            .field .player:active {
                cursor: grabbing;
            }
            .players-container .player {
                cursor: grab;
                touch-action: manipulation;
            }
            .players-container .player:active {
                cursor: grabbing;
            }
            .players-container .ball {
                cursor: grab;
                touch-action: manipulation;
            }
            .players-container .ball:active {
                cursor: grabbing;
            }
            .player.custom {
                background-color: var(--custom-color);
                color: white;
            }
            .ball-on-field {
                cursor: grab;
                touch-action: none;
            }
            .ball-on-field:active {
                cursor: grabbing;
            }
        `;
        document.head.appendChild(style);
    }
    
    function init() {
        initField();
        initMenuPlayers();
        setupMenuObserver();
        
        if (resetBtn) {
            resetBtn.addEventListener('click', resetField);
        }
        if (defaultBtn) {
            defaultBtn.addEventListener('click', setDefaultFormation);
        }
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (playersOnField.length === 0 && ballsOnField.length === 0) {
                    setDefaultFormation();
                }
            }, 200);
        });
        
        setTimeout(setDefaultFormation, 100);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();