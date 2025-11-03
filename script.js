 // State Management
        const state = {
            originalImage: null,
            currentImage: null,
            filters: {
                brightness: 100,
                contrast: 100,
                saturation: 100,
                hue: 0,
                blur: 0,
                grayscale: 0,
                sepia: 0,
                inversion: 0
            },
            crop: {
                width: null,
                height: null
            },
            isComparing: false,
            isDarkMode: localStorage.getItem('darkMode') === 'true'
        };

        // DOM Elements
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');
        const themeToggle = document.getElementById('themeToggle');
        const previewContainer = document.getElementById('previewContainer');
        const tabs = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        // Initialize Theme
        if (state.isDarkMode) {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
        }

        // Theme Toggle
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            state.isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', state.isDarkMode);
            themeToggle.textContent = state.isDarkMode ? '☀️' : '🌙';
        });

        // Tab Navigation
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(content => content.style.display = 'none');
                tab.classList.add('active');
                document.getElementById(`${tabName}-tab`).style.display = 'block';
            });
        });

        // Upload Handling
        uploadArea.addEventListener('click', () => imageInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) loadImage(files[0]);
        });

        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) loadImage(e.target.files[0]);
        });

        function loadImage(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    state.originalImage = img;
                    state.currentImage = img;
                    resetFilters();
                    drawImage();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        // Filter Event Listeners
        ['brightness', 'contrast', 'saturation', 'hue', 'blur', 'grayscale', 'sepia', 'inversion'].forEach(filter => {
            document.getElementById(filter).addEventListener('input', (e) => {
                const value = e.target.value;
                state.filters[filter] = value;
                
                // Update label
                if (filter === 'hue') {
                    document.getElementById(`${filter}Value`).textContent = `${value}°`;
                } else if (filter === 'blur') {
                    document.getElementById(`${filter}Value`).textContent = `${value}px`;
                } else {
                    document.getElementById(`${filter}Value`).textContent = `${value}%`;
                }

                drawImage();
            });
        });

        // Apply Filters and Draw Image
        function drawImage() {
            if (!state.currentImage) return;

            canvas.width = state.currentImage.width;
            canvas.height = state.currentImage.height;

            const { brightness, contrast, saturation, hue, blur, grayscale, sepia, inversion } = state.filters;

            const filterString = `
                brightness(${brightness}%) 
                contrast(${contrast}%) 
                saturate(${saturation}%) 
                hue-rotate(${hue}deg) 
                blur(${blur}px) 
                grayscale(${grayscale}%) 
                sepia(${sepia}%) 
                invert(${inversion}%)
            `;

            ctx.filter = filterString;
            ctx.drawImage(state.currentImage, 0, 0);
            ctx.filter = 'none';
        }

        // Reset Filters
        document.getElementById('resetFilters').addEventListener('click', resetFilters);

        function resetFilters() {
            state.filters = {
                brightness: 100,
                contrast: 100,
                saturation: 100,
                hue: 0,
                blur: 0,
                grayscale: 0,
                sepia: 0,
                inversion: 0
            };

            ['brightness', 'contrast', 'saturation', 'hue', 'blur', 'grayscale', 'sepia', 'inversion'].forEach(filter => {
                const element = document.getElementById(filter);
                element.value = state.filters[filter];
                
                if (filter === 'hue') {
                    document.getElementById(`${filter}Value`).textContent = `${state.filters[filter]}°`;
                } else if (filter === 'blur') {
                    document.getElementById(`${filter}Value`).textContent = `${state.filters[filter]}px`;
                } else {
                    document.getElementById(`${filter}Value`).textContent = `${state.filters[filter]}%`;
                }
            });

            drawImage();
        }

        // Crop and Resize
        document.getElementById('applyCrop').addEventListener('click', () => {
            const width = parseInt(document.getElementById('cropWidth').value);
            const height = parseInt(document.getElementById('cropHeight').value);

            if (!width || !height || width <= 0 || height <= 0) {
                showNotification('Please enter valid width and height', 'error');
                return;
            }

            state.crop.width = width;
            state.crop.height = height;

            const resizedCanvas = document.createElement('canvas');
            resizedCanvas.width = width;
            resizedCanvas.height = height;
            const resizeCtx = resizedCanvas.getContext('2d');
            resizeCtx.drawImage(state.currentImage, 0, 0, width, height);

            state.currentImage = new Image();
            state.currentImage.onload = () => {
                document.getElementById('cropWidth').value = width;
                document.getElementById('cropHeight').value = height;
                document.getElementById('widthValue').textContent = width;
                document.getElementById('heightValue').textContent = height;
                drawImage();
                showNotification('✂️ Image resized successfully!');
            };
            state.currentImage.src = resizedCanvas.toDataURL();
        });

        document.getElementById('resetCrop').addEventListener('click', () => {
            state.currentImage = state.originalImage;
            document.getElementById('cropWidth').value = '';
            document.getElementById('cropHeight').value = '';
            document.getElementById('widthValue').textContent = '-';
            document.getElementById('heightValue').textContent = '-';
            drawImage();
        });

        // Before/After Comparison
        document.getElementById('enableComparison').addEventListener('click', () => {
            state.isComparing = true;
            previewContainer.innerHTML = `
                <div class="comparison-container active">
                    <div class="comparison-before">
                        <canvas id="beforeCanvas"></canvas>
                    </div>
                    <div class="comparison-after">
                        <canvas id="afterCanvas"></canvas>
                    </div>
                    <div class="comparison-slider"></div>
                </div>
            `;

            const beforeCanvas = document.getElementById('beforeCanvas');
            const afterCanvas = document.getElementById('afterCanvas');
            const beforeCtx = beforeCanvas.getContext('2d');
            const afterCtx = afterCanvas.getContext('2d');

            beforeCanvas.width = state.originalImage.width;
            beforeCanvas.height = state.originalImage.height;
            afterCanvas.width = state.currentImage.width;
            afterCanvas.height = state.currentImage.height;

            beforeCtx.drawImage(state.originalImage, 0, 0);
            afterCtx.filter = `
                brightness(${state.filters.brightness}%) 
                contrast(${state.filters.contrast}%) 
                saturate(${state.filters.saturation}%) 
                hue-rotate(${state.filters.hue}deg) 
                blur(${state.filters.blur}px) 
                grayscale(${state.filters.grayscale}%) 
                sepia(${state.filters.sepia}%) 
                invert(${state.filters.inversion}%)
            `;
            afterCtx.drawImage(state.currentImage, 0, 0);

            const slider = document.querySelector('.comparison-slider');
            const container = document.querySelector('.comparison-container');

            slider.addEventListener('mousedown', () => {
                document.addEventListener('mousemove', moveSlider);
                document.addEventListener('mouseup', () => document.removeEventListener('mousemove', moveSlider));
            });

            function moveSlider(e) {
                const rect = container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = (x / rect.width) * 100;
                document.querySelector('.comparison-after').style.width = Math.max(0, Math.min(100, percent)) + '%';
                slider.style.left = Math.max(0, Math.min(100, percent)) + '%';
            }

            document.getElementById('enableComparison').style.display = 'none';
            document.getElementById('disableComparison').style.display = 'block';
        });

        document.getElementById('disableComparison').addEventListener('click', () => {
            state.isComparing = false;
            previewContainer.innerHTML = '<canvas id="imageCanvas"></canvas>';
            const newCanvas = document.getElementById('imageCanvas');
            const newCtx = newCanvas.getContext('2d');
            newCanvas.width = state.currentImage.width;
            newCanvas.height = state.currentImage.height;
            drawImage();
            document.getElementById('enableComparison').style.display = 'block';
            document.getElementById('disableComparison').style.display = 'none';
        });

        // Save Image
        document.getElementById('saveImage').addEventListener('click', () => {
            if (!state.currentImage) {
                showNotification('Please upload an image first', 'error');
                return;
            }

            const format = document.getElementById('formatSelect').value;
            const link = document.createElement('a');
            link.href = canvas.toDataURL(`image/${format}`);
            link.download = `edited-image-${Date.now()}.${format}`;
            link.click();
            showNotification(`✨ Image saved as ${format.toUpperCase()}!`);
        });

        // Reset All
        document.getElementById('resetImage').addEventListener('click', () => {
            state.originalImage = null;
            state.currentImage = null;
            resetFilters();
            canvas.width = 0;
            canvas.height = 0;
            imageInput.value = '';
            showNotification('🔄 All changes reset!');
        });

        // Notification
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }