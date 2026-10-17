document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawing-board');
    const ctx = canvas.getContext('2d');

    const toggleBtn = document.getElementById('toggle-toolbar-btn');
    const toolbar = document.querySelector('.toolbar');
    const toolButtons = document.querySelectorAll('.tool-btn');
    const penColorPicker = document.getElementById('penColorPicker');
    const penSizeSlider = document.getElementById('penSizeSlider');
    const penSizeValue = document.getElementById('penSizeValue');
    const boardColorPicker = document.getElementById('boardColorPicker');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    const newPageBtn = document.getElementById('newPageBtn');
    const imageLoader = document.getElementById('imageLoader');
    const historyBtn = document.getElementById('historyBtn');
    const historyPanel = document.getElementById('historyPanel');
    const historyContent = document.getElementById('historyContent');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const selectedObjectToolbar = document.getElementById('selectedObjectToolbar');
    const selectedObjectColorPicker = document.getElementById('selectedObjectColorPicker');
    const textTools = document.getElementById('textTools');
    const fontFamilySelector = document.getElementById('fontFamilySelector');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const lockedObjectsList = document.getElementById('lockedObjectsList');

    // ELEMENTÊN NÛ
    const fontSizeInput = document.getElementById('fontSizeInput');
    const uploadFontBtn = document.getElementById('uploadFontBtn');
    const fontLoader = document.getElementById('fontLoader');
    const lockAllBtn = document.getElementById('lockAllBtn'); 
    
    // Elementên Hesabkerê
    const openCalculatorBtn = document.getElementById('open-calculator-btn');
    const calculatorOverlay = document.getElementById('calculator-overlay');
    const closeCalculatorBtn = document.getElementById('close-calculator-btn');
    const calculatorIframe = document.getElementById('calculator-iframe');

    let penWidth = 5;
    let penColor = '#000000';
    let currentTool = 'pen';
    let isDrawing = false;
    let startX, startY;

    let canvasObjects = [];
    let history = [];
    let undoStack = [];
    let redoStack = [];

    let selectedObject = null;
    let isDragging = false;
    let isResizing = false;
    let isRotating = false;
    let resizeHandle = '';
    let dragOffsetX, dragOffsetY;
    let isLockAllActive = false;

    function saveState() {
        redoStack = [];
        undoStack.push(JSON.parse(JSON.stringify(canvasObjects)));
        if(undoStack.length > 30) undoStack.shift();
    }

    function undo() {
        if (undoStack.length < 2) return;
        redoStack.push(undoStack.pop());
        canvasObjects = JSON.parse(JSON.stringify(undoStack[undoStack.length - 1]));
        canvasObjects.forEach(obj => {
            if(obj.type === 'image' && obj.src) {
                const img = new Image();
                img.src = obj.src;
                obj.img = img;
            }
        });
        redrawCanvas();
    }

    function redo() {
        if (redoStack.length === 0) return;
        const state = redoStack.pop();
        undoStack.push(state);
        canvasObjects = JSON.parse(JSON.stringify(state));
         canvasObjects.forEach(obj => {
            if(obj.type === 'image' && obj.src) {
                const img = new Image();
                img.src = obj.src;
                obj.img = img;
            }
        });
        redrawCanvas();
    }

    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        redrawCanvas();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    saveState();

    function updateLockedObjectsList() {
        lockedObjectsList.innerHTML = '';
        const lockedItems = canvasObjects.filter(obj => obj.locked);
        
        if (lockedItems.length === 0) {
            lockedObjectsList.innerHTML = '<p style="font-size: 0.8rem; text-align: center; opacity: 0.7;">Ti tişt nehatiye girtin.</p>';
            return;
        }

        lockedItems.forEach((obj, index) => {
            const originalIndex = canvasObjects.indexOf(obj);
            const itemDiv = document.createElement('div');
            itemDiv.className = 'locked-item';
            
            let name = obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
            if (obj.type === 'text') name = `Text: "${obj.text.substring(0, 10)}..."`;
            if (obj.type === 'image') name = 'Wêne';

            itemDiv.innerHTML = `<span>${name}</span>`;
            
            const unlockBtn = document.createElement('button');
            unlockBtn.className = 'unlock-btn';
            unlockBtn.textContent = 'Veke';
            unlockBtn.onclick = () => {
                canvasObjects[originalIndex].locked = false;
                redrawCanvas();
            };
            
            itemDiv.appendChild(unlockBtn);
            lockedObjectsList.appendChild(itemDiv);
        });
    }

    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = boardColorPicker.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        canvasObjects.forEach(obj => {
            drawObject(obj);
        });

        if (selectedObject) {
            drawSelectionBox(selectedObject);
        }
        updateLockedObjectsList();
    }

    function drawObject(obj) {
        if (!obj || obj.isEditing) return;
        ctx.save();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        const bounds = getObjectBounds(obj);
        const centerX = bounds.x + bounds.w / 2;
        const centerY = bounds.y + bounds.h / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(obj.rotation * Math.PI / 180);
        ctx.translate(-centerX, -centerY);

        ctx.strokeStyle = obj.color;
        ctx.lineWidth = obj.width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        if(obj.type === 'eraser') {
             ctx.strokeStyle = boardColorPicker.value;
        }

        switch (obj.type) {
            case 'pencil': ctx.globalAlpha = 0.6; ctx.lineWidth = obj.width * 0.5; break;
            case 'brush': ctx.globalAlpha = 0.4; break;
            case 'marker': ctx.shadowColor = obj.color; ctx.shadowBlur = obj.width / 2; ctx.globalAlpha = 0.8; break;
        }

        ctx.beginPath();
        switch (obj.type) {
            case 'pen': case 'pencil': case 'brush': case 'marker': case 'eraser':
                if (obj.points.length === 0) break;
                ctx.moveTo(obj.points[0].x, obj.points[0].y);
                obj.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
                break;
            case 'rectangle': ctx.strokeRect(obj.x, obj.y, obj.w, obj.h); break;
            case 'circle': ctx.arc(obj.x + obj.radius, obj.y + obj.radius, obj.radius, 0, 2 * Math.PI); ctx.stroke(); break;
            case 'star': drawStar(obj.x, obj.y, obj.radius, obj.color, obj.width); break;
            case 'image': if(obj.img && obj.img.complete) { ctx.drawImage(obj.img, obj.x, obj.y, obj.w, obj.h); } break;
            case 'text': ctx.fillStyle = obj.color; ctx.font = `${obj.fontSize}px "${obj.fontFamily || 'Arial'}"`; ctx.fillText(obj.text, obj.x, obj.y); break;
        }
        ctx.restore();
    }
    
    function drawDeleteIcon(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = '#d14c4c';
        ctx.fillStyle = 'rgba(209, 76, 76, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-4, -4);
        ctx.lineTo(4, 4);
        ctx.moveTo(4, -4);
        ctx.lineTo(-4, 4);
        ctx.stroke();
        ctx.restore();
    }
    
    function drawLockIcon(x, y, isLocked) {
        ctx.save();
        ctx.translate(x, y);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#333';
        ctx.fillStyle = isLocked ? 'rgba(240, 173, 78, 0.8)' : 'rgba(240, 240, 240, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.rect(-5, 0, 10, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -2, 4, Math.PI, 0);
        if (!isLocked) {
            ctx.moveTo(4, -2);
            ctx.lineTo(6, -8); 
        }
        ctx.stroke();
        ctx.restore();
    }

    function drawSelectionBox(obj) {
        const bounds = getObjectBounds(obj);
        if(bounds.w === 0 || bounds.h === 0) return;

        const centerX = bounds.x + bounds.w / 2;
        const centerY = bounds.y + bounds.h / 2;
    
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(obj.rotation * Math.PI / 180);
        ctx.translate(-centerX, -centerY);
    
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.w + 10, bounds.h + 10);
        ctx.setLineDash([]);
    
        const handles = getResizeHandles(bounds);
        ctx.fillStyle = '#007bff';
        for (const handle in handles) {
            const pos = handles[handle];
            ctx.fillRect(pos.x - 5, pos.y - 5, 10, 10);
        }
    
        ctx.beginPath();
        ctx.moveTo(centerX, bounds.y - 5);
        ctx.lineTo(centerX, bounds.y - 25);
        ctx.stroke();
        ctx.fillStyle = '#dc3545';
        ctx.beginPath();
        ctx.arc(centerX, bounds.y - 25, 8, 0, 2 * Math.PI);
        ctx.fill();

        const deleteX = bounds.x - 15;
        const deleteY = bounds.y - 15;
        drawDeleteIcon(deleteX, deleteY);
        
        const lockX = bounds.x + bounds.w + 15;
        const lockY = bounds.y - 15;
        drawLockIcon(lockX, lockY, obj.locked);
    
        ctx.restore();
    }

    function getResizeHandles(bounds) {
        return {
            'tl': { x: bounds.x - 5, y: bounds.y - 5 },
            'tr': { x: bounds.x + bounds.w + 5, y: bounds.y - 5 },
            'bl': { x: bounds.x - 5, y: bounds.y + bounds.h + 5 },
            'br': { x: bounds.x + bounds.w + 5, y: bounds.y + bounds.h + 5 }
        };
    }

    function getCoordinates(e) {
        if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }
    
    function startPosition(e) {
        e.preventDefault();
        const { x, y } = getCoordinates(e);
        startX = x;
        startY = y;

        if (selectedObject && !selectedObject.locked) {
            const bounds = getObjectBounds(selectedObject);
            const handles = getResizeHandles(bounds);
            
            const rotatedPoint = rotatePoint({x, y}, {x: bounds.x + bounds.w/2, y: bounds.y + bounds.h/2}, -selectedObject.rotation);

            for (const handle in handles) {
                if (Math.hypot(rotatedPoint.x - handles[handle].x, rotatedPoint.y - handles[handle].y) < 10) {
                    isResizing = true; resizeHandle = handle; redrawCanvas(); return;
                }
            }
            if (Math.hypot(rotatedPoint.x - (bounds.x + bounds.w / 2), rotatedPoint.y - (bounds.y - 25)) < 10) {
                isRotating = true; redrawCanvas(); return;
            }
             if (Math.hypot(rotatedPoint.x - (bounds.x + bounds.w + 15), rotatedPoint.y - (bounds.y - 15)) < 12) {
                selectedObject.locked = !selectedObject.locked;
                if (selectedObject.locked) selectedObject = null;
                redrawCanvas(); return;
            }
            if (Math.hypot(rotatedPoint.x - (bounds.x - 15), rotatedPoint.y - (bounds.y - 15)) < 12) {
                const index = canvasObjects.indexOf(selectedObject);
                if (index > -1) canvasObjects.splice(index, 1);
                selectedObject = null;
                saveState(); redrawCanvas(); return;
            }
        }

        let clickedObject = getObjectAtPosition(x, y);
        const drawingTools = ['pen', 'pencil', 'brush', 'marker', 'eraser'];
        const isDrawingToolActive = drawingTools.includes(currentTool);

        if (clickedObject) {
            const isPathObject = drawingTools.includes(clickedObject.type);

            if (!isPathObject || (isPathObject && currentTool === 'select')) {
                if (clickedObject.locked) return;
                selectedObject = clickedObject;
                isDragging = true; isDrawing = false;
                const bounds = getObjectBounds(selectedObject);
                
                const center = { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
                const rotatedStart = rotatePoint({ x: startX, y: startY }, center, -selectedObject.rotation);
                dragOffsetX = rotatedStart.x - bounds.x;
                dragOffsetY = rotatedStart.y - bounds.y;
                
                selectedObjectToolbar.style.display = 'block';
                selectedObjectColorPicker.value = selectedObject.color;
                if (selectedObject.type === 'text') {
                    textTools.style.display = 'block';
                    fontFamilySelector.value = selectedObject.fontFamily || 'Arial';
                    fontSizeInput.value = selectedObject.fontSize;
                } else {
                    textTools.style.display = 'none';
                }
                redrawCanvas();
                return;
            }
        }

        if (isDrawingToolActive) {
            selectedObject = null; selectedObjectToolbar.style.display = 'none';
            isDrawing = true; isDragging = false;
            let newObj = { type: currentTool, points: [{ x, y }], color: penColor, width: penWidth, rotation: 0, locked: false };
            canvasObjects.push(newObj);
        } else if (currentTool === 'text') {
            isDrawing = false;
            const text = prompt("تکایە دەقەکەت بنووسە:", "");
            if (text) {
                let newObj = { type: 'text', text, x, y, color: penColor, fontSize: 25, fontFamily: 'Arial', rotation: 0, locked: false };
                canvasObjects.push(newObj);
                saveState();
            }
        } else {
            if (currentTool === 'select') {
                selectedObject = null; selectedObjectToolbar.style.display = 'none';
            }
            isDrawing = (currentTool !== 'select');
            isDragging = false;
        }

        redrawCanvas();
    }

    function draw(e) {
        if (!isDrawing && !isDragging && !isResizing && !isRotating) return;
        e.preventDefault();
        const { x, y } = getCoordinates(e);

        if (isDragging && selectedObject) {
            const bounds = getObjectBounds(selectedObject);
            const center = { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
            const rotatedCurrent = rotatePoint({ x, y }, center, -selectedObject.rotation);
            const newX = rotatedCurrent.x - dragOffsetX;
            const newY = rotatedCurrent.y - dragOffsetY;
            moveObject(selectedObject, newX, newY);
            redrawCanvas();
            return;
        }
        
        if(isResizing && selectedObject) {
            const bounds = getObjectBounds(selectedObject);
            const center = { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
            const rotatedMouse = rotatePoint({x,y}, center, -selectedObject.rotation);
            resizeObject(selectedObject, rotatedMouse.x, rotatedMouse.y);
            redrawCanvas();
            return;
        }

        if(isRotating && selectedObject) {
            rotateObject(selectedObject, x, y);
            redrawCanvas();
            return;
        }

        if (!isDrawing) return;
        
        let tempObj = null;
        switch(currentTool) {
            case 'pen': case 'pencil': case 'brush': case 'marker': case 'eraser':
                canvasObjects[canvasObjects.length - 1].points.push({ x, y });
                break;
            case 'rectangle':
                tempObj = { type: 'rectangle', x: Math.min(x, startX), y: Math.min(y, startY), w: Math.abs(x - startX), h: Math.abs(y - startY), color: penColor, width: penWidth, rotation: 0 };
                break;
            case 'circle':
                const radius = Math.hypot(x - startX, y - startY) / 2;
                const centerX = (startX + x) / 2;
                const centerY = (startY + y) / 2;
                tempObj = { type: 'circle', x: centerX-radius, y: centerY-radius, radius, color: penColor, width: penWidth, rotation: 0 };
                break;
             case 'star':
                const starRadius = Math.hypot(x-startX, y-startY);
                tempObj = { type: 'star', x: startX, y: startY, radius: starRadius, color: penColor, width: penWidth, rotation: 0 };
                break;
        }
        
        redrawCanvas();
        if (tempObj) {
            drawObject(tempObj);
        }
    }
    
    function endPosition(e) {
        if (isDragging || isResizing || isRotating) {
             saveState();
        }
        isDragging = false;
        isResizing = false;
        isRotating = false;

        if (!isDrawing) return;
        isDrawing = false;

        const { x, y } = (e.changedTouches) ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY } : { x: e.clientX, y: e.clientY };

        let newObj;
        switch(currentTool) {
            case 'pen': case 'pencil': case 'brush': case 'marker': case 'eraser':
                if (canvasObjects.length > 0) {
                    const lastPath = canvasObjects[canvasObjects.length - 1];
                    if (lastPath.points.length < 2) canvasObjects.pop();
                }
                break;
            case 'rectangle':
                newObj = { type: 'rectangle', x: Math.min(x, startX), y: Math.min(y, startY), w: Math.abs(x-startX), h: Math.abs(y-startY), color: penColor, width: penWidth, rotation: 0, locked: false };
                if (newObj.w > 5 && newObj.h > 5) canvasObjects.push(newObj);
                break;
            case 'circle':
                 const radius = Math.hypot(x-startX, y-startY) / 2;
                 const centerX = (startX + x) / 2;
                 const centerY = (startY + y) / 2;
                 newObj = { type: 'circle', x: centerX-radius, y: centerY-radius, w: radius*2, h: radius*2, radius, color: penColor, width: penWidth, rotation: 0, locked: false };
                 if (newObj.radius > 5) canvasObjects.push(newObj);
                 break;
            case 'star':
                const starRadius = Math.hypot(x-startX, y-startY);
                newObj = { type: 'star', x: startX, y: startY, radius: starRadius, color: penColor, width: penWidth, rotation: 0, locked: false };
                if (newObj.radius > 5) canvasObjects.push(newObj);
                break;
        }
        
        saveState();
        redrawCanvas();
    }
    
    function getObjectAtPosition(x, y) {
        for (let i = canvasObjects.length - 1; i >= 0; i--) {
            const obj = canvasObjects[i];
            const bounds = getObjectBounds(obj);
            const center = { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
            const rotatedPoint = rotatePoint({x, y}, center, -obj.rotation);

            if (rotatedPoint.x >= bounds.x && rotatedPoint.x <= bounds.x + bounds.w && rotatedPoint.y >= bounds.y && rotatedPoint.y <= bounds.y + bounds.h) {
                if (obj.type === 'circle') {
                    const circleCenter = { x: bounds.x + bounds.w/2, y: bounds.y + bounds.h/2 };
                    if (Math.hypot(rotatedPoint.x - circleCenter.x, rotatedPoint.y - circleCenter.y) <= obj.radius) {
                        return obj;
                    }
                } else {
                    return obj;
                }
            }
        }
        return null;
    }
    
    function getObjectBounds(obj) {
        switch (obj.type) {
            case 'pen': case 'pencil': case 'brush': case 'marker': case 'eraser':
                if (obj.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                obj.points.forEach(p => {
                    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
                });
                const padding = obj.width;
                return { x: minX - padding, y: minY - padding, w: (maxX - minX) + padding*2, h: (maxY - minY) + padding*2 };
            case 'rectangle': return { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
            case 'circle': return { x: obj.x, y: obj.y, w: obj.radius * 2, h: obj.radius * 2 };
            case 'star': return { x: obj.x - obj.radius, y: obj.y - obj.radius, w: obj.radius * 2, h: obj.radius * 2 };
            case 'image': return { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
            case 'text': 
                ctx.font = `${obj.fontSize}px "${obj.fontFamily || 'Arial'}"`;
                const measure = ctx.measureText(obj.text);
                const height = measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent;
                return { x: obj.x, y: obj.y - measure.actualBoundingBoxAscent, w: measure.width, h: height };
            default: return { x: 0, y: 0, w: 0, h: 0 };
        }
    }

    function moveObject(obj, newX, newY) {
        const bounds = getObjectBounds(obj);
        const dx = newX - bounds.x;
        const dy = newY - bounds.y;
        
        if(['pen', 'pencil', 'brush', 'marker', 'eraser'].includes(obj.type)) {
           obj.points.forEach(p => { p.x += dx; p.y += dy; });
        } else {
           obj.x += dx;
           obj.y += dy;
        }
    }
    
    function rotatePoint(point, center, angle) {
        const angleRad = angle * Math.PI / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        return {
            x: center.x + (dx * cos - dy * sin),
            y: center.y + (dx * sin + dy * cos)
        };
    }

    function resizeObject(obj, mouseX, mouseY) {
        const originalBounds = getObjectBounds(obj);
        let { x, y, w, h } = originalBounds;
        
        const maintainAspectRatio = (obj.type === 'image' || obj.type === 'circle' || obj.type === 'star');
        const aspectRatio = originalBounds.w / originalBounds.h;

        let newW = w, newH = h, newX = x, newY = y;

        if (resizeHandle.includes('r')) newW = mouseX - x;
        if (resizeHandle.includes('l')) { newW = x + w - mouseX; newX = mouseX; }
        if (resizeHandle.includes('b')) newH = mouseY - y;
        if (resizeHandle.includes('t')) { newH = y + h - mouseY; newY = mouseY; }

        if (maintainAspectRatio) {
            if (resizeHandle.includes('r') || resizeHandle.includes('l')) {
                newH = newW / aspectRatio;
            } else {
                newW = newH * aspectRatio;
            }
             if (resizeHandle.includes('t')) { newY = y + h - newH; }
             if (resizeHandle.includes('l')) { newX = x + w - newW; }
        }
        
        if (['pen', 'pencil', 'brush', 'marker', 'eraser'].includes(obj.type)) {
            const scaleX = newW / originalBounds.w;
            const scaleY = newH / originalBounds.h;
            obj.points.forEach(p => {
                p.x = newX + (p.x - originalBounds.x) * scaleX;
                p.y = newY + (p.y - originalBounds.y) * scaleY;
            });
             obj.width *= Math.min(scaleX, scaleY);
        } else if (obj.type === 'text') {
            obj.fontSize *= (newH / originalBounds.h);
            obj.x = newX;
            obj.y = newY + obj.fontSize * 0.8;
        }
        else {
            obj.x = newX; obj.y = newY;
            obj.w = newW; obj.h = newH;
            if(obj.type === 'circle') {
                obj.radius = newW / 2;
                obj.x = newX;
                obj.y = newY;
            }
             if(obj.type === 'star') {
                obj.x = newX + newW/2;
                obj.y = newY + newH/2;
                obj.radius = Math.min(newW, newH) / 2;
            }
        }
    }

    function rotateObject(obj, x, y) {
        const bounds = getObjectBounds(obj);
        const centerX = bounds.x + bounds.w / 2;
        const centerY = bounds.y + bounds.h / 2;
        const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI + 90;
        obj.rotation = angle;
    }

    function drawStar(cx, cy, radius, color, width, spikes=5) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        let rot = Math.PI/2*3;
        let x=cx, y=cy;
        let step = Math.PI / spikes;
        ctx.moveTo(cx, cy - radius);
        for(let i=0; i<spikes; i++) {
            x = cx + Math.cos(rot) * radius;
            y = cy + Math.sin(rot) * radius;
            ctx.lineTo(x,y);
            rot += step;
            x = cx + Math.cos(rot) * (radius/2.5);
            y = cy + Math.sin(rot) * (radius/2.5);
            ctx.lineTo(x,y);
            rot += step;
        }
        ctx.lineTo(cx, cy - radius);
        ctx.closePath();
        ctx.stroke();
    }
    
    function handleDoubleClick(e) {
        const { x, y } = getCoordinates(e);
        const clickedObject = getObjectAtPosition(x, y);
        if (clickedObject && clickedObject.type === 'text' && !clickedObject.locked) {
            editText(clickedObject);
        }
    }

    function editText(textObject) {
        textObject.isEditing = true;
        selectedObject = null;
        redrawCanvas();
        
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        
        const bounds = getObjectBounds(textObject);
        const centerX = bounds.x + bounds.w / 2;
        const centerY = bounds.y + bounds.h / 2;

        textarea.value = textObject.text;
        Object.assign(textarea.style, {
            position: 'absolute',
            left: `${canvas.offsetLeft + bounds.x}px`,
            top: `${canvas.offsetTop + bounds.y}px`,
            width: `${bounds.w + 20}px`,
            height: `${bounds.h + 10}px`,
            fontSize: `${textObject.fontSize}px`,
            fontFamily: `"${textObject.fontFamily}"`,
            color: textObject.color,
            lineHeight: 1.2,
            border: '1px dashed #007bff',
            outline: 'none',
            zIndex: '1000',
            padding: '5px',
            margin: '0',
            overflow: 'hidden',
            resize: 'both',
            transformOrigin: 'center center',
            transform: `rotate(${textObject.rotation}deg)`,
            whiteSpace: 'pre-wrap',
            backgroundColor: 'rgba(255, 255, 255, 0.8)'
        });
        textarea.focus();
        textarea.select();

        const finishEditing = () => {
            const newText = textarea.value;
            if (newText.trim()) {
                textObject.text = newText;
            } else {
                const index = canvasObjects.indexOf(textObject);
                if (index > -1) canvasObjects.splice(index, 1);
            }
            delete textObject.isEditing;
            document.body.removeChild(textarea);
            saveState(); 
            redrawCanvas();
            textarea.removeEventListener('blur', finishEditing);
            textarea.removeEventListener('keydown', handleKeydown);
        };

        const handleKeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEditing(); }
            else if (e.key === 'Escape') { textarea.value = textObject.text; finishEditing(); }
        };
        
        textarea.addEventListener('blur', finishEditing);
        textarea.addEventListener('keydown', handleKeydown);
    }

    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endPosition);
    canvas.addEventListener('mouseout', endPosition);
    canvas.addEventListener('touchstart', startPosition, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endPosition);
    canvas.addEventListener('dblclick', handleDoubleClick);

    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
             if (btn.dataset.tool === 'image') { imageLoader.click(); return; }
            document.querySelector('.tool-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            if(currentTool !== 'select') { 
                selectedObject = null; 
                selectedObjectToolbar.style.display = 'none';
                redrawCanvas(); 
            }
        });
    });

    imageLoader.addEventListener('change', e => {
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const newWidth = 200;
                const newHeight = newWidth / aspectRatio;
                const newObj = { type: 'image', img, x: 20, y: 20, w: newWidth, h: newHeight, rotation: 0, src: reader.result, locked: false };
                canvasObjects.push(newObj); saveState(); redrawCanvas();
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file); e.target.value = null;
    });
    
    penColorPicker.addEventListener('input', (e) => penColor = e.target.value);
    selectedObjectColorPicker.addEventListener('input', (e) => { if(selectedObject) { selectedObject.color = e.target.value; redrawCanvas(); } });
    selectedObjectColorPicker.addEventListener('change', () => saveState());
    fontFamilySelector.addEventListener('input', (e) => { if(selectedObject && selectedObject.type === 'text') { selectedObject.fontFamily = e.target.value; redrawCanvas(); } });
    fontFamilySelector.addEventListener('change', () => saveState());
    fontSizeInput.addEventListener('input', (e) => { if (selectedObject && selectedObject.type === 'text') { const newSize = parseInt(e.target.value); if (!isNaN(newSize) && newSize > 0) { selectedObject.fontSize = newSize; redrawCanvas(); } } });
    fontSizeInput.addEventListener('change', () => saveState());
    uploadFontBtn.addEventListener('click', () => { fontLoader.click(); });
    fontLoader.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const fontDataUrl = event.target.result; const fontName = file.name.split('.').slice(0, -1).join('.');
            const newStyle = document.createElement('style'); newStyle.appendChild(document.createTextNode(`@font-face { font-family: "${fontName}"; src: url(${fontDataUrl}); }`));
            document.head.appendChild(newStyle); const option = document.createElement('option'); option.value = fontName; option.textContent = fontName;
            fontFamilySelector.appendChild(option); fontFamilySelector.value = fontName;
            if (selectedObject && selectedObject.type === 'text') { selectedObject.fontFamily = fontName; saveState(); redrawCanvas(); }
        };
        reader.readAsDataURL(file); e.target.value = null;
    });

    penSizeSlider.addEventListener('input', (e) => { penWidth = e.target.value; penSizeValue.textContent = penWidth; });
    boardColorPicker.addEventListener('input', redrawCanvas);
    toggleBtn.addEventListener('click', () => toolbar.classList.toggle('visible'));
    clearBtn.addEventListener('click', () => { if (confirm("Hûn piştrast in ku hûn dixwazin her tiştî paqij bikin?")) { canvasObjects = []; selectedObject = null; canvas.style.backgroundImage = ''; saveState(); redrawCanvas(); } });
    newPageBtn.addEventListener('click', () => { if(canvasObjects.length > 0) { history.push(canvas.toDataURL()); } canvasObjects = []; selectedObject = null; canvas.style.backgroundImage = ''; saveState(); redrawCanvas(); });
    saveBtn.addEventListener('click', () => { selectedObject = null; redrawCanvas(); setTimeout(() => { const link = document.createElement('a'); link.download = 'sabura-wene.png'; link.href = canvas.toDataURL('image/png'); link.click(); }, 100); });
    historyBtn.addEventListener('click', () => {
        historyContent.innerHTML = '';
        if(history.length === 0) historyContent.innerHTML = "<p>پێشینە بەتاڵە.</p>";
        else {
            history.forEach((dataUrl, index) => {
                const img = document.createElement('img'); img.src = dataUrl; img.title = `وێنەی ژمارە ${index + 1}`;
                img.onclick = () => {
                    const historyImg = new Image();
                    historyImg.onload = () => { canvasObjects = []; selectedObject = null; ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(historyImg, 0, 0); historyPanel.style.display = 'none'; }
                    historyImg.src = dataUrl;
                };
                historyContent.appendChild(img);
            });
        }
        historyPanel.style.display = 'flex';
    });
    closeHistoryBtn.addEventListener('click', () => historyPanel.style.display = 'none');
    lockAllBtn.addEventListener('click', () => {
        isLockAllActive = !isLockAllActive; lockAllBtn.classList.toggle('active', isLockAllActive);
        canvasObjects.forEach(obj => { obj.locked = isLockAllActive; });
        if (isLockAllActive) { selectedObject = null; selectedObjectToolbar.style.display = 'none'; }
        redrawCanvas();
    });
    openCalculatorBtn.addEventListener('click', () => { if (calculatorIframe.src === 'about:blank' || !calculatorIframe.src) { calculatorIframe.src = 'calculated.html'; } calculatorOverlay.style.display = 'flex'; });
    closeCalculatorBtn.addEventListener('click', () => { calculatorOverlay.style.display = 'none'; });
    calculatorOverlay.addEventListener('click', (e) => { if (e.target === calculatorOverlay) { calculatorOverlay.style.display = 'none'; } });
});
