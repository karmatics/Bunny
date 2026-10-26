class Bunny {

  async run(env) {
      if (!env || !env.container) {
        throw new Error("[Bunny] run() requires an environment object with a valid container.");
      }
      this.env = env;
      const targetElement = env.container;

      this.titleElement = null;
      this.statusDiv = null;
      this.configSection = null;
      this.configTextarea = null;
      this.createBoxButton = null;
      this.autoLoadedBox = null;
      this.autoLoadedBoxDimensionDisplay = null;
      this.configuredBoxes = [];

      this._handleResize = () => {
        if (typeof this.onResize === 'function') {
          this.onResize(targetElement.clientWidth, targetElement.clientHeight);
        }
      };
      window.addEventListener('resize', this._handleResize);

      applyCss(
        `
        .basics-app-container { 
            background-color: #f4f6f9; 
            color: #2c3e50;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            padding-bottom: 150px; 
            min-height: 100vh; 
            box-sizing: border-box; 
            width: 100%;
        }
        .app-title { color: #2c3e50; margin-top: 0; margin-bottom: 15px; }
        .status-message { font-style: italic; color: #555; margin-top: 10px; min-height: 1.2em; }
        .config-section {
            margin-top: 20px; padding: 15px; border: 1px solid #cbd5e1;
            background-color: #ffffff; border-radius: 8px; max-width: 450px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .config-section label { display: block; margin-bottom: 8px; font-weight: 600; color: #475569; }
        .config-section textarea {
            width: 100%; min-height: 100px; font-family: monospace; font-size: 0.9em;
            border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; margin-bottom: 10px; 
            resize: vertical; box-sizing: border-box; background: #f8fafc; color: #1e293b;
        }
        .config-section button { 
            padding: 8px 16px; background-color: #3b82f6; color: white; 
            border: none; border-radius: 4px; cursor: pointer; font-weight: 600; 
        }
        .config-section button:hover { background-color: #2563eb; }
        .dimension-display { font-size: 0.85em; color: #64748b; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px; }

        @keyframes bunnyHop {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          30% { transform: translateY(-14px) scale(0.96, 1.05); }
          50% { transform: translateY(0) scale(1.04, 0.95); }
          70% { transform: translateY(-6px) scale(0.98, 1.02); }
        }
        .bunny-svg-wrapper svg {
          transition: transform 0.2s ease;
        }
        .bunny-svg-wrapper:hover svg {
          transform: scale(1.03);
        }
        .bunny-svg-wrapper.hopping svg {
          animation: bunnyHop 0.55s ease;
        }
        `,
        'basicsWithDialogBox-app-styles'
      );

      targetElement.classList.add('basics-app-container');

      this.titleElement = makeElement('h1', { className: 'app-title' }, '🐇 Bunny');

      this.containerSizeDisplay = makeElement('div', {
        className: 'dimension-display',
        style: { fontWeight: 'bold', color: '#336', marginBottom: '10px', borderTop: 'none', paddingTop: 0 }
      }, 'Container size: W x H');

      this.statusDiv = makeElement('div', { className: 'status-message' }, 'App loaded.');

      targetElement.appendChild(this.titleElement);
      targetElement.appendChild(this.containerSizeDisplay);
      targetElement.appendChild(this.statusDiv);

      this.autoLoadedBoxDimensionDisplay = makeElement('div', { className: 'dimension-display' }, 'Inner size: W x H');

      const containerWidth = targetElement.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
      const boxWidth = Math.min(320, Math.max(260, containerWidth - 40));

      this.autoLoadedBox = UITools.makeDialog({
        env: this.env,
        title: 'Bunny Companion',
        size: [boxWidth, 380],
        position: [20, 40],
        onGeometryChange: (boxInstance, geometry) => {
          if (this.autoLoadedBoxDimensionDisplay && geometry && geometry.inner) {
            this.autoLoadedBoxDimensionDisplay.textContent = `Inner Size: ${geometry.inner.width.toFixed(0)}W x ${geometry.inner.height.toFixed(0)}H`;
          }
        },
      });

      const bunnySvgElement = this.createBunnySvg(160, 176);
      bunnySvgElement.addEventListener('click', () => {
        this.statusDiv.textContent = 'Bunny hopped! 🐇🥕';
      });
      this.autoLoadedBox.contentElement.appendChild(bunnySvgElement);

      this.autoLoadedBox.contentElement.appendChild(
        makeElement('p', { style: { marginTop: '4px', textAlign: 'center', fontSize: '0.9em', color: '#475569' } }, 'Click the bunny to make it hop!')
      );

      const buttonRow = makeElement('div', { style: { textAlign: 'center', marginTop: '8px' } },
        makeElement('button', {
          style: { padding: '6px 14px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc' },
          onclick: () => {
            bunnySvgElement.click();
          }
        }, '🥕 Feed Bunny')
      );
      this.autoLoadedBox.contentElement.appendChild(buttonRow);
      this.autoLoadedBox.contentElement.appendChild(this.autoLoadedBoxDimensionDisplay);

      const defaultBoxOptions = {
        title: 'Configured Box',
        size: [280, 180],
        position: [360, 40],
        transparent: false,
        titleBarAtBottom: false,
      };

      this.configSection = makeElement('div', { className: 'config-section' });
      const configLabel = makeElement('label', { htmlFor: 'boxConfigInput' }, 'Configure & Create New Box (JSON):');
      this.configTextarea = makeElement('textarea', { style: { height: '180px' }, id: 'boxConfigInput' }, JSON.stringify(defaultBoxOptions, null, 2));
      this.createBoxButton = makeElement('button', 'Create Box from Config');
      this.createBoxButton.onclick = () => this.createConfigurableBox();

      this.configSection.appendChild(configLabel);
      this.configSection.appendChild(this.configTextarea);
      this.configSection.appendChild(this.createBoxButton);
      targetElement.appendChild(this.configSection);

      this.statusDiv.textContent = 'App Initialized. Try clicking the bunny or creating new boxes.';

      setTimeout(() => {
        this._handleResize();
        if (this.autoLoadedBox && typeof this.autoLoadedBox.triggerCallback === 'function') {
          this.autoLoadedBox.triggerCallback();
        }
      }, 10);
    }
  onResize(width, height) {
    if (this.containerSizeDisplay) {
      this.containerSizeDisplay.textContent = `Container size: ${Math.round(
        width
      )}W x ${Math.round(height)}H`;
    }
  }

  createConfigurableBox() {
    if (!this.configTextarea || !this.statusDiv) {
      console.error('Required elements not initialized.');
      return;
    }

    const jsonString = this.configTextarea.value;
    let options;

    try {
      options = JSON.parse(jsonString);
      options.env = this.env;
      this.statusDiv.textContent = 'Creating box with provided config...';

      const configuredBox = UITools.makeDialog(options);

      if (!options.contentHTML && !options.contentElement) {
        configuredBox.contentElement.appendChild(
          makeElement(
            'p',
            { style: { marginTop: 0 } },
            `Box created with title: "${options.title || 'Untitled'}"`
          )
        );
        configuredBox.contentElement.appendChild(
          makeElement(
            'p',
            `Size: ${options.size ? options.size.join('x') : 'Default'}`
          )
        );
      }

      this.configuredBoxes.push(configuredBox);
      this.statusDiv.textContent = `DialogBox "${options.title || 'Untitled'}" created successfully. Count: ${this.configuredBoxes.length}`;
    } catch (error) {
      console.error('Error parsing JSON config:', error);
      this.statusDiv.textContent = `Error: Invalid JSON configuration. ${error.message}`;
      alert(`Invalid JSON configuration:\n${error.message}\nPlease check the text area.`);
    }
  }

  getLastConfiguredBox() {
    return this.configuredBoxes.length > 0
      ? this.configuredBoxes[this.configuredBoxes.length - 1]
      : null;
  }

  destroy() {
    window.removeEventListener('resize', this._handleResize);
    if (this.autoLoadedBox && typeof this.autoLoadedBox.close === 'function') {
      this.autoLoadedBox.close();
    }
    if (this.configuredBoxes) {
      this.configuredBoxes.forEach((box) => {
        if (box && typeof box.close === 'function') box.close();
      });
      this.configuredBoxes = [];
    }
  }

  createBunnySvg(width = 160, height = 176) {
      const container = document.createElement('div');
      container.className = 'bunny-svg-wrapper';
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'center';
      container.style.margin = '8px 0';
      container.style.cursor = 'pointer';

      container.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="${width}" height="${height}" role="img" aria-label="Cute Bunny holding a carrot">
          <defs>
            <linearGradient id="bunnyFurGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="100%" stop-color="#f1f5f9"/>
            </linearGradient>
            <linearGradient id="bunnyPinkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fed7e2"/>
              <stop offset="100%" stop-color="#fbb6ce"/>
            </linearGradient>
            <linearGradient id="carrotBodyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#fb923c"/>
              <stop offset="100%" stop-color="#ea580c"/>
            </linearGradient>
            <linearGradient id="carrotLeafGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#4ade80"/>
              <stop offset="100%" stop-color="#16a34a"/>
            </linearGradient>
          </defs>

          <!-- Ground Shadow -->
          <ellipse cx="100" cy="204" rx="56" ry="8" fill="#cbd5e1" opacity="0.6"/>

          <!-- Fluffy Tail -->
          <circle cx="146" cy="170" r="13" fill="url(#bunnyFurGrad)" stroke="#cbd5e1" stroke-width="2"/>

          <!-- Left Ear -->
          <g transform="rotate(-12 80 50)">
            <ellipse cx="80" cy="50" rx="14" ry="42" fill="url(#bunnyFurGrad)" stroke="#cbd5e1" stroke-width="2"/>
            <ellipse cx="80" cy="52" rx="7.5" ry="32" fill="url(#bunnyPinkGrad)"/>
          </g>

          <!-- Right Ear -->
          <g transform="rotate(12 120 50)">
            <ellipse cx="120" cy="50" rx="14" ry="42" fill="url(#bunnyFurGrad)" stroke="#cbd5e1" stroke-width="2"/>
            <ellipse cx="120" cy="52" rx="7.5" ry="32" fill="url(#bunnyPinkGrad)"/>
          </g>

          <!-- Body -->
          <ellipse cx="100" cy="155" rx="46" ry="42" fill="url(#bunnyFurGrad)" stroke="#cbd5e1" stroke-width="2"/>
          <ellipse cx="100" cy="158" rx="28" ry="26" fill="#ffffff"/>

          <!-- Back Feet -->
          <ellipse cx="64" cy="195" rx="18" ry="10" fill="url(#bunnyFurGrad)" stroke="#cbd5e1" stroke-width="2"/>
          <ellipse cx="64" cy="194" rx="8" ry="5" fill="url(#bunnyPinkGrad)"/>
          <ellipse cx="136" cy="195" rx="18" ry="10" fill="url(#bunnyFurGrad)" stroke="#cbd5e1" stroke-width="2"/>
          <ellipse cx="136" cy="194" rx="8" ry="5" fill="url(#bunnyPinkGrad)"/>

          <!-- Carrot with Foliage -->
          <g transform="rotate(-20 105 155)">
            <path d="M 125 125 C 132 110 142 112 138 122 C 134 126 128 128 124 130 Z" fill="url(#carrotLeafGrad)"/>
            <path d="M 124 125 C 122 105 130 105 130 116 C 128 122 126 126 123 129 Z" fill="url(#carrotLeafGrad)"/>
            <path d="M 121 126 C 114 110 120 108 123 118 C 123 123 122 126 121 128 Z" fill="url(#carrotLeafGrad)"/>
            <path d="M 116 130 Q 128 133 126 140 L 96 175 Q 92 176 93 171 Z" fill="url(#carrotBodyGrad)"/>
            <path d="M 112 140 Q 118 142 121 143" stroke="#c2410c" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            <path d="M 105 150 Q 110 152 114 153" stroke="#c2410c" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            <path d="M 99 160 Q 103 161 106 162" stroke="#c2410c" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </g>

          <!-- Front Paws -->
          <ellipse cx="80" cy="154" rx="10" ry="7.5" transform="rotate(-15 80 154)" fill="url(#bunnyFurGrad)" stroke="#cbd5e1" stroke-width="1.5"/>
          <ellipse cx="118" cy="155" rx="10" ry="7.5" transform="rotate(15 118 155)" fill="url(#bunnyFurGrad)" stroke="#cbd5e1" stroke-width="1.5"/>

          <!-- Head -->
          <ellipse cx="100" cy="102" rx="42" ry="36" fill="url(#bunnyFurGrad)" stroke="#cbd5e1" stroke-width="2"/>
          <path d="M 96 68 C 98 62 101 62 100 68 C 102 62 106 63 104 69" stroke="#cbd5e1" stroke-width="1.5" fill="none" stroke-linecap="round"/>

          <!-- Cheeks Blush -->
          <ellipse cx="76" cy="112" rx="7" ry="5" fill="#f472b6" opacity="0.45"/>
          <ellipse cx="124" cy="112" rx="7" ry="5" fill="#f472b6" opacity="0.45"/>

          <!-- Whiskers -->
          <path d="M 58 106 Q 70 108 80 110" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M 56 114 Q 68 114 79 113" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M 59 122 Q 70 118 79 116" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" fill="none"/>

          <path d="M 142 106 Q 130 108 120 110" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M 144 114 Q 132 114 121 113" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M 141 122 Q 130 118 121 116" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" fill="none"/>

          <!-- Eyes with Highlights -->
          <ellipse cx="84" cy="98" rx="5" ry="6" fill="#1e293b"/>
          <circle cx="82.5" cy="95.5" r="2" fill="#ffffff"/>
          <circle cx="85.5" cy="99.5" r="0.9" fill="#ffffff"/>

          <ellipse cx="116" cy="98" rx="5" ry="6" fill="#1e293b"/>
          <circle cx="114.5" cy="95.5" r="2" fill="#ffffff"/>
          <circle cx="117.5" cy="99.5" r="0.9" fill="#ffffff"/>

          <!-- Nose -->
          <path d="M 97 106 Q 100 104 103 106 Q 100 110 97 106 Z" fill="#f472b6"/>

          <!-- Mouth & Tooth -->
          <path d="M 100 109 L 100 113" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M 94 113 Q 100 117 100 113 Q 100 117 106 113" stroke="#475569" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <rect x="98" y="114" width="4" height="4.5" rx="1" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
        </svg>
      `.trim();

      container.addEventListener('click', () => {
        container.classList.remove('hopping');
        // Reflow trigger for animation restart
        void container.offsetWidth;
        container.classList.add('hopping');
      });

      return container;
    }
}

globalThis.Bunny = Bunny;
if (typeof module !== 'undefined' && module.exports) module.exports = Bunny;
