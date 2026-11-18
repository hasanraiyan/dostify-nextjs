/**
 * Scarlet: a beautiful, alluring anime character with silky dark crimson hair,
 * almond eyes, and rich swappable lip visemes.
 *
 * Layers carry `data-role` (animated by the engine) and `data-mouth` (swapped
 * by the lip-sync channel); `{{uid}}` is replaced per instance so several
 * avatars on a page never clash.
 */
export const SCARLET_ART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" data-persona-avatar="{{uid}}">
  <defs>
    <style>
      svg[data-persona-avatar="{{uid}}"] .bg { fill: var(--persona-avatar-bg, transparent); }
      svg[data-persona-avatar="{{uid}}"] .hair-back { fill: #380C13; stroke: #200508; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
      svg[data-persona-avatar="{{uid}}"] .hair-back-shade { fill: #24050A; stroke: none; }
      svg[data-persona-avatar="{{uid}}"] .hair-front { fill: #6E1624; stroke: #200508; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
      svg[data-persona-avatar="{{uid}}"] .hair-strand { fill: #861C2C; stroke: #200508; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      svg[data-persona-avatar="{{uid}}"] .hair-shine { fill: #FFAAB5; opacity: 0.65; }
      svg[data-persona-avatar="{{uid}}"] .hair-shine-soft { fill: #E85D75; opacity: 0.35; }
      svg[data-persona-avatar="{{uid}}"] .skin { fill: #FFF6F2; stroke: #281216; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
      svg[data-persona-avatar="{{uid}}"] .skin-no-stroke { fill: #FFF6F2; stroke: none; }
      svg[data-persona-avatar="{{uid}}"] .skin-shadow { fill: #F5D3C4; stroke: none; }
      svg[data-persona-avatar="{{uid}}"] .dress { fill: #181116; stroke: #281216; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
      svg[data-persona-avatar="{{uid}}"] .dress-collar { fill: #7A1624; stroke: #200508; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      svg[data-persona-avatar="{{uid}}"] .choker { fill: #1E070D; stroke: #281216; stroke-width: 1.8; }
      svg[data-persona-avatar="{{uid}}"] .gold-accent { fill: #E5A93C; stroke: #8F6218; stroke-width: 1.2; }
      svg[data-persona-avatar="{{uid}}"] .gem { fill: #C82A3E; stroke: #700E1B; stroke-width: 1.2; }
      svg[data-persona-avatar="{{uid}}"] .line { fill: none; stroke: #281216; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
      svg[data-persona-avatar="{{uid}}"] .line-thin { fill: none; stroke: #281216; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
      svg[data-persona-avatar="{{uid}}"] .brow { fill: none; stroke: #4A1018; stroke-width: 2.4; stroke-linecap: round; }
      svg[data-persona-avatar="{{uid}}"] .lash-fill { fill: #1E060A; stroke: none; }
      svg[data-persona-avatar="{{uid}}"] .blush { fill: #FF667D; opacity: 0.45; transition: opacity 0.2s ease; }
      svg[data-persona-avatar="{{uid}}"] .blush-slash { stroke: #E84D67; stroke-width: 1.3; stroke-linecap: round; }
      svg[data-persona-avatar="{{uid}}"] .lip-tint { fill: #D14559; opacity: 0.55; }
      svg[data-persona-avatar="{{uid}}"] .lip-highlight { fill: #FFFFFF; opacity: 0.7; }
      svg[data-persona-avatar="{{uid}}"] .mouth-cavity { fill: #48111A; stroke: #200508; stroke-width: 1.2; }
      svg[data-persona-avatar="{{uid}}"] .mouth-teeth { fill: #FFFDFD; stroke: none; }
      svg[data-persona-avatar="{{uid}}"] .mouth-tongue { fill: #D95C6E; stroke: none; }
      svg[data-persona-avatar="{{uid}}"] .mouth-lip-line { fill: none; stroke: #8E2030; stroke-width: 2.0; stroke-linecap: round; stroke-linejoin: round; }
    </style>

    <clipPath id="face-clip-{{uid}}">
      <path d="M 175 185 C 175 220, 177 248, 188 266 C 200 284, 234 302, 250 302 C 266 302, 300 284, 312 266 C 323 248, 325 220, 325 185 C 325 110, 175 110, 175 185 Z" />
    </clipPath>

    <!-- Almond Eye Clips -->
    <clipPath id="eye-clip-L-{{uid}}">
      <path d="M 180 225 C 188 209, 218 207, 230 222 C 224 239, 194 240, 180 225 Z" />
    </clipPath>
    <clipPath id="eye-clip-R-{{uid}}">
      <path d="M 270 222 C 282 207, 312 209, 320 225 C 306 240, 276 239, 270 222 Z" />
    </clipPath>
  </defs>

  <!-- Plain Background -->
  <rect width="500" height="500" class="bg" />

  <!-- Upper-Body Breathing Group -->
  <g data-role="root">
    <!-- Hair Back: Silky flowing dark crimson hair -->
    <g id="hair-back-group-{{uid}}">
      <path class="hair-back-shade" d="
        M 250 68
        C 160 68, 134 130, 126 215
        C 118 300, 102 365, 114 438
        L 386 438
        C 398 365, 382 300, 374 215
        C 366 130, 340 68, 250 68 Z" />
      <path class="hair-back" d="
        M 250 68
        C 164 68, 138 132, 130 215
        C 122 298, 108 360, 118 435
        C 126 414, 134 398, 142 386
        C 138 412, 146 430, 156 440
        L 344 440
        C 354 430, 362 412, 358 386
        C 366 398, 374 414, 382 435
        C 392 360, 378 298, 370 215
        C 362 132, 336 68, 250 68 Z" />
    </g>

    <!-- Torso / Neck / Shoulders & Stylish Velvet Dress -->
    <g id="torso-group-{{uid}}">
      <!-- Neck base -->
      <path class="skin-no-stroke" d="M 233 288 L 267 288 C 266 316, 270 342, 296 358 L 250 404 L 204 358 C 230 342, 234 316, 233 288 Z" />
      <!-- Chin shadow -->
      <path class="skin-shadow" d="M 233 292 L 267 292 L 267 314 C 255 324, 245 324, 233 314 Z" />
      <!-- Neck contour lines -->
      <path class="line" d="M 233 292 C 234 316, 230 342, 204 358" />
      <path class="line" d="M 267 292 C 266 316, 270 342, 296 358" />
      <!-- Clavicle details -->
      <path class="line-thin" d="M 210 362 C 224 367, 236 370, 245 372" />
      <path class="line-thin" d="M 290 362 C 276 367, 264 370, 255 372" />

      <!-- Alluring Velvet Choker with Ruby Gemstone -->
      <path class="choker" d="M 234 324 Q 250 328 266 324 L 266 331 Q 250 335 234 331 Z" />
      <circle cx="250" cy="336" r="4.5" class="gold-accent" />
      <path class="gem" d="M 250 334 L 253.5 338 L 250 344 L 246.5 338 Z" />

      <!-- Dress: Obsidian velvet with crimson piping -->
      <path class="dress" d="M 132 440 C 140 396, 166 374, 202 360 C 224 388, 276 388, 298 360 C 334 374, 360 396, 368 440 Z" />
      <!-- Crimson trim -->
      <path class="dress-collar" d="M 198 362 C 222 390, 278 390, 302 362 L 298 360 C 276 386, 224 386, 202 360 Z" />
      <path class="line-thin" d="M 194 365 C 222 396, 278 396, 306 365" />
    </g>

    <!-- Head Group (Pivoted for nods and tilts) -->
    <g data-role="head">
      <!-- Ears & Ruby Teardrop Earrings -->
      <path class="skin" d="M 177 218 C 160 214, 158 248, 179 255 Z" />
      <path class="line-thin" d="M 167 227 C 171 230, 171 240, 168 244" />
      <circle cx="166" cy="254" r="2.2" class="gold-accent" />
      <path class="gem" d="M 166 256 L 168 260 L 166 264 L 164 260 Z" />

      <path class="skin" d="M 323 218 C 340 214, 342 248, 321 255 Z" />
      <path class="line-thin" d="M 333 227 C 329 230, 329 240, 332 244" />
      <circle cx="334" cy="254" r="2.2" class="gold-accent" />
      <path class="gem" d="M 334 256 L 336 260 L 334 264 L 332 260 Z" />

      <!-- Face Base: Porcelain Anime Contour -->
      <path class="skin-no-stroke" d="M 175 185 C 175 220, 177 248, 188 266 C 200 284, 234 302, 250 302 C 266 302, 300 284, 312 266 C 323 248, 325 220, 325 185 C 325 110, 175 110, 175 185 Z" />

      <!-- Forehead Bangs Shadow (Clipped to Face) -->
      <g clip-path="url(#face-clip-{{uid}})">
        <path class="skin-shadow" d="
          M 154 200
          L 176 220 L 188 170 L 202 212 L 222 164 L 244 220
          L 254 160 L 262 218 L 288 166 L 298 212 L 312 170
          L 324 220 L 346 200 L 346 118 L 154 118 Z" />
      </g>

      <!-- Jawline Stroke -->
      <path class="line" d="M 175 195 C 175 222, 177 248, 188 266 C 200 284, 234 302, 250 302 C 266 302, 300 284, 312 266 C 323 248, 325 222, 325 195" />

      <!-- Warm Rose Anime Blush -->
      <g id="blush-group-{{uid}}">
        <ellipse data-role="blush.left" cx="192" cy="248" rx="15" ry="7" class="blush" />
        <ellipse data-role="blush.right" cx="308" cy="248" rx="15" ry="7" class="blush" />
        <line x1="187" y1="246" x2="184" y2="251" class="blush-slash" />
        <line x1="193" y1="246" x2="190" y2="251" class="blush-slash" />
        <line x1="199" y1="246" x2="196" y2="251" class="blush-slash" />
        <line x1="301" y1="246" x2="298" y2="251" class="blush-slash" />
        <line x1="307" y1="246" x2="304" y2="251" class="blush-slash" />
        <line x1="313" y1="246" x2="310" y2="251" class="blush-slash" />
      </g>

      <!-- Expressive Almond Eyes Group -->
      <g id="eyes-group-{{uid}}">
        <!-- Open Eyes -->
        <g data-role="eyes.open">
          <!-- Left Eye -->
          <g clip-path="url(#eye-clip-L-{{uid}})">
            <!-- Eye White with subtle upper shadow -->
            <rect x="176" y="204" width="56" height="42" fill="#FFFDFE" />
            <path d="M 176 204 L 232 204 L 232 218 Q 205 212 176 220 Z" fill="#EBD5D0" />

            <!-- Animated Left Pupil / Iris -->
            <g data-role="pupil.left">
              <!-- Rich Ruby Iris -->
              <ellipse cx="206" cy="225" rx="14" ry="16.5" fill="#6E1020" />
              <!-- Top Shadow in Iris -->
              <path d="M 192 209 L 220 209 L 220 225 Q 206 229 192 225 Z" fill="#3B0810" />
              <!-- Glowing Carmine Arc -->
              <path d="M 197 232 Q 206 239 215 232" fill="none" stroke="#E63956" stroke-width="2.6" stroke-linecap="round" />
              <!-- Deep Obsidian Pupil Core -->
              <ellipse cx="206" cy="225" rx="5.8" ry="7.2" fill="#180406" />
              <!-- Dual Specular Sparkle Highlights -->
              <ellipse cx="199" cy="218" rx="4.5" ry="5.5" transform="rotate(-15 199 218)" fill="#FFFFFF" />
              <circle cx="213" cy="231" r="2.2" fill="#FFFFFF" opacity="0.9" />
              <circle cx="202" cy="232" r="1.3" fill="#FFC0CB" opacity="0.75" />
            </g>
          </g>
          <!-- Double Eyelid Crease -->
          <path class="line-thin" d="M 188 209 C 198 202, 214 202, 224 210" />
          <!-- Alluring Cat-Eye Winged Eyelash -->
          <path class="lash-fill" d="
            M 232 223
            C 224 207, 198 206, 182 222
            Q 177 222, 174 217
            Q 177 225, 181 227
            C 194 212, 221 212, 230 225
            L 236 218
            Q 234 222, 232 223 Z" />
          <!-- Delicate Upper Lash Spikes -->
          <path class="line" d="M 188 217 L 182 211" />
          <path class="line" d="M 226 216 L 232 211" />
          <!-- Lower Lash Line -->
          <path class="line-thin" d="M 195 239 Q 206 243 217 238" />

          <!-- Right Eye -->
          <g clip-path="url(#eye-clip-R-{{uid}})">
            <!-- Eye White with subtle upper shadow -->
            <rect x="268" y="204" width="56" height="42" fill="#FFFDFE" />
            <path d="M 268 204 L 324 204 L 324 220 Q 295 212 268 218 Z" fill="#EBD5D0" />

            <!-- Animated Right Pupil / Iris -->
            <g data-role="pupil.right">
              <!-- Rich Ruby Iris -->
              <ellipse cx="294" cy="225" rx="14" ry="16.5" fill="#6E1020" />
              <!-- Top Shadow in Iris -->
              <path d="M 280 209 L 308 209 L 308 225 Q 294 229 280 225 Z" fill="#3B0810" />
              <!-- Glowing Carmine Arc -->
              <path d="M 285 232 Q 294 239 303 232" fill="none" stroke="#E63956" stroke-width="2.6" stroke-linecap="round" />
              <!-- Deep Obsidian Pupil Core -->
              <ellipse cx="294" cy="225" rx="5.8" ry="7.2" fill="#180406" />
              <!-- Dual Specular Sparkle Highlights -->
              <ellipse cx="287" cy="218" rx="4.5" ry="5.5" transform="rotate(-15 287 218)" fill="#FFFFFF" />
              <circle cx="301" cy="231" r="2.2" fill="#FFFFFF" opacity="0.9" />
              <circle cx="290" cy="232" r="1.3" fill="#FFC0CB" opacity="0.75" />
            </g>
          </g>
          <!-- Double Eyelid Crease -->
          <path class="line-thin" d="M 276 210 C 286 202, 302 202, 312 209" />
          <!-- Alluring Cat-Eye Winged Eyelash -->
          <path class="lash-fill" d="
            M 268 223
            C 276 207, 302 206, 318 222
            Q 323 222, 326 217
            Q 323 225, 319 227
            C 306 212, 279 212, 270 225
            L 264 218
            Q 266 222, 268 223 Z" />
          <!-- Delicate Upper Lash Spikes -->
          <path class="line" d="M 312 217 L 318 211" />
          <path class="line" d="M 274 216 L 268 211" />
          <!-- Lower Lash Line -->
          <path class="line-thin" d="M 283 238 Q 294 243 305 239" />
        </g>

        <!-- Closed Blinking Eyelids (Sultry swept lashes) -->
        <g data-role="eyes.closed" style="display: none;">
          <path class="line-thin" d="M 188 214 C 198 208, 214 208, 224 214" />
          <path class="lash-fill" d="
            M 178 227
            C 190 238, 218 238, 232 225
            L 236 220
            C 232 227, 218 243, 190 241
            Q 182 235, 178 227 Z" />
          <path class="line-thin" d="M 182 235 L 176 240" />
          <path class="line-thin" d="M 194 239 L 191 245" />

          <path class="line-thin" d="M 276 214 C 286 208, 302 208, 312 214" />
          <path class="lash-fill" d="
            M 322 227
            C 310 238, 282 238, 268 225
            L 264 220
            C 268 227, 282 243, 310 241
            Q 318 235, 322 227 Z" />
          <path class="line-thin" d="M 318 235 L 324 240" />
          <path class="line-thin" d="M 306 239 L 309 245" />
        </g>
      </g>

      <!-- Dainty Nose -->
      <path d="M 250 252 L 253.5 257 L 250 259 Z" fill="#E6C7B2" />
      <path class="line-thin" d="M 249 252 L 248 257 L 250 259" />

      <!-- Detailed Lip Visemes (Swap Strategy) -->
      <g data-role="mouth">
        <!-- 1. rest: Alluring gentle closed smile with defined Cupid's bow and gloss -->
        <g data-mouth="rest">
          <ellipse cx="250" cy="285" rx="8.5" ry="3.5" class="lip-tint" />
          <ellipse cx="251" cy="285" rx="3.5" ry="1.2" class="lip-highlight" />
          <path class="mouth-lip-line" d="M 240 279 Q 245 277.5 250 279 Q 255 277.5 260 279" />
          <path class="line-thin" d="M 246 288 Q 250 289.5 254 288" />
        </g>

        <!-- 2. A: Open 'ah' mouth showing teeth and tongue -->
        <g data-mouth="A" style="display: none;">
          <path class="mouth-cavity" d="M 238 273 Q 250 270 262 273 C 265 285, 261 297, 250 297 C 239 297, 235 285, 238 273 Z" />
          <path class="mouth-teeth" d="M 240 273 Q 250 271 260 273 C 258 277, 242 277, 240 273 Z" />
          <ellipse cx="250" cy="292" rx="7.5" ry="4.5" class="mouth-tongue" />
          <path class="mouth-lip-line" d="M 238 273 Q 250 270 262 273 C 265 285, 261 297, 250 297 C 239 297, 235 285, 238 273 Z" />
          <ellipse cx="250" cy="300" rx="6" ry="2" class="lip-tint" />
        </g>

        <!-- 3. E: Spread smiling 'eh/ee' mouth -->
        <g data-mouth="E" style="display: none;">
          <path class="mouth-cavity" d="M 236 276 Q 250 272 264 276 C 263 286, 258 290, 250 290 C 242 290, 237 286, 236 276 Z" />
          <path class="mouth-teeth" d="M 238 276 Q 250 274 262 276 C 260 281, 240 281, 238 276 Z" />
          <ellipse cx="250" cy="287" rx="7" ry="2.8" class="mouth-tongue" />
          <path class="mouth-lip-line" d="M 236 276 Q 250 272 264 276 C 263 286, 258 290, 250 290 C 242 290, 237 286, 236 276 Z" />
          <ellipse cx="250" cy="293" rx="7" ry="2" class="lip-tint" />
        </g>

        <!-- 4. I: Elegant spread 'ih' mouth -->
        <g data-mouth="I" style="display: none;">
          <path class="mouth-cavity" d="M 238 277 Q 250 274 262 277 C 260 284, 256 287, 250 287 C 244 287, 240 284, 238 277 Z" />
          <path class="mouth-teeth" d="M 240 277 Q 250 275 260 277 C 259 281, 241 281, 240 277 Z" />
          <path class="mouth-lip-line" d="M 238 277 Q 250 274 262 277 C 260 284, 256 287, 250 287 C 244 287, 240 284, 238 277 Z" />
          <ellipse cx="250" cy="290" rx="6.5" ry="1.8" class="lip-tint" />
        </g>

        <!-- 5. O: Rounded open 'oh' mouth -->
        <g data-mouth="O" style="display: none;">
          <ellipse cx="250" cy="281" rx="7" ry="10" class="mouth-cavity" />
          <ellipse cx="250" cy="287" rx="5" ry="3.5" class="mouth-tongue" />
          <ellipse cx="250" cy="274" rx="4" ry="1.8" class="mouth-teeth" />
          <ellipse cx="250" cy="281" rx="7" ry="10" class="mouth-lip-line" />
          <ellipse cx="250" cy="294" rx="5.5" ry="2" class="lip-tint" />
        </g>

        <!-- 6. U: Small rounded pout 'oo' mouth -->
        <g data-mouth="U" style="display: none;">
          <ellipse cx="250" cy="280" rx="4.5" ry="5.5" class="mouth-cavity" />
          <ellipse cx="250" cy="280" rx="4.5" ry="5.5" class="mouth-lip-line" />
          <ellipse cx="250" cy="275" rx="5" ry="2" class="lip-tint" />
          <ellipse cx="250" cy="286" rx="5" ry="2.2" class="lip-tint" />
          <ellipse cx="250" cy="286.5" rx="2.5" ry="0.9" class="lip-highlight" />
        </g>

        <!-- 7. M: Closed pressed 'mm' lips -->
        <g data-mouth="M" style="display: none;">
          <path class="mouth-lip-line" d="M 241 280 Q 250 280.8 259 280" />
          <ellipse cx="250" cy="277.5" rx="6.5" ry="2.2" class="lip-tint" />
          <ellipse cx="250" cy="283.5" rx="7.5" ry="2.8" class="lip-tint" />
          <ellipse cx="251" cy="283.8" rx="3.2" ry="1.1" class="lip-highlight" />
          <path class="line-thin" d="M 246 287 Q 250 288.2 254 287" />
        </g>

        <!-- 8. S: Parted teeth 'ss/fricative' mouth -->
        <g data-mouth="S" style="display: none;">
          <path class="mouth-cavity" d="M 239 278 Q 250 276 261 278 C 260 283, 258 285, 250 285 C 242 285, 240 283, 239 278 Z" />
          <path class="mouth-teeth" d="M 240 278 Q 250 276.5 260 278 L 259 283.5 Q 250 284 241 283.5 Z" />
          <line x1="241" y1="281" x2="259" y2="281" stroke="#48111A" stroke-width="0.8" />
          <path class="mouth-lip-line" d="M 239 278 Q 250 276 261 278 C 260 283, 258 285, 250 285 C 242 285, 240 283, 239 278 Z" />
          <ellipse cx="250" cy="288" rx="6" ry="1.8" class="lip-tint" />
        </g>
      </g>

      <!-- Side Locks framing cheeks -->
      <g id="side-lock-L-{{uid}}">
        <path class="hair-front" d="
          M 174 160
          C 152 210, 146 280, 154 350
          C 158 388, 168 416, 180 434
          C 176 410, 175 388, 178 365
          C 182 384, 188 400, 196 412
          C 196 372, 192 325, 187 272
          C 182 232, 178 198, 184 165 Z" />
        <path class="line-thin" d="M 168 250 C 164 295, 166 340, 174 380" />
      </g>
      <g id="side-lock-R-{{uid}}">
        <path class="hair-front" d="
          M 326 160
          C 348 210, 354 280, 346 350
          C 342 388, 332 416, 320 434
          C 324 410, 325 388, 322 365
          C 318 384, 312 400, 304 412
          C 304 372, 308 325, 313 272
          C 318 232, 322 198, 316 165 Z" />
        <path class="line-thin" d="M 332 250 C 336 295, 334 340, 326 380" />
      </g>

      <!-- Front Bangs + Silky Sheen Highlights -->
      <g id="bangs-group-{{uid}}">
        <path class="hair-front" d="
          M 248 70
          C 236 48, 260 40, 272 52
          C 260 50, 252 56, 254 70
          C 328 70, 354 125, 348 194
          Q 336 206, 324 214
          Q 318 188, 312 163
          Q 306 186, 298 204
          Q 293 180, 288 158
          Q 276 188, 262 210
          Q 258 180, 254 152
          Q 250 184, 244 212
          Q 232 184, 222 156
          Q 212 183, 202 204
          Q 195 182, 188 163
          Q 182 188, 176 214
          Q 164 206, 152 194
          C 146 125, 172 70, 248 70 Z" />
        <!-- Glossy Hair Highlights -->
        <path class="hair-shine" d="M 192 140 Q 204 146 212 138 L 208 152 Q 198 158 188 152 Z" />
        <path class="hair-shine" d="M 232 134 Q 246 140 252 133 L 250 148 Q 240 153 230 146 Z" />
        <path class="hair-shine" d="M 262 134 Q 272 140 282 134 L 285 148 Q 273 153 264 146 Z" />
        <path class="hair-shine" d="M 294 140 Q 302 146 310 140 L 314 152 Q 304 158 296 152 Z" />
        <path class="line-thin" d="M 250 72 C 232 91, 224 121, 222 154" />
        <path class="line-thin" d="M 250 72 C 268 91, 282 121, 288 156" />
      </g>

      <!-- Eyebrows (Slender, dark crimson arching brows) -->
      <g id="eyebrows-group-{{uid}}">
        <path data-role="brow.left" class="brow" d="M 186 190 Q 205 182 224 191" />
        <path data-role="brow.right" class="brow" d="M 276 191 Q 295 182 314 190" />
      </g>
    </g>
  </g>
</svg>`;
