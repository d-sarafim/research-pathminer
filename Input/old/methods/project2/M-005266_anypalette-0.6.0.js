constructor(options) {
  var c, component_name, cyan, i, j, key, l, len, len1, len2, magenta, powed, ref, ref1, reject_args, rgb, white_D50, x, xyz, y, yellow, z;
  // @TODO: don't assign all of {@red, @green, @blue, @hue, @saturation, @value, @lightness} right away
  // only assign the properties that are used
  ({red: this.red, green: this.green, blue: this.blue, hue: this.hue, saturation: this.saturation, value: this.value, lightness: this.lightness, cyan, magenta, yellow, key, alpha: this.alpha, name: this.name} = options);
  for (i = 0, len = component_names.length; i < len; i++) {
    component_name = component_names[i];
    if (!(options[component_name] != null)) {
      continue;
    }
    if ((!isFinite(options[component_name])) || (typeof options[component_name] !== "number")) {
      throw new TypeError(`Color component option ${component_name} is not a finite number: ${JSON.stringify(options[component_name])}`);
    }
    if (options[component_name] < 0 || options[component_name] > 1) {
      throw new TypeError(`Color component option ${component_name} outside range of [0,1]: ${options[component_name]}`);
    }
  }
  reject_args = function() {
    throw new TypeError(`Color constructor must be called with {red,green,blue} or {hue,saturation,value} or {hue,saturation,lightness} or {cyan,magenta,yellow,key} or {x,y,z} or {l,a,b}, ${(function() {
      try {
        return `got ${JSON.stringify(options)}`;
      } catch (error) {
        return "got something that couldn't be displayed with JSON.stringify for this error message";
      }
    })()}`);
  };
  if ((this.red != null) && (this.green != null) && (this.blue != null)) {

  // Red Green Blue
  // (no conversions needed here)
  } else if ((this.hue != null) && (this.saturation != null)) {
    // Cylindrical Color Space
    if (this.value != null) {
      // Hue Saturation Value
      this.lightness = (2 - this.saturation) * this.value / 2;
      this.saturation = this.saturation * this.value / (this.lightness < 0.5 ? this.lightness * 2 : 2 - this.lightness * 2);
      if (isNaN(this.saturation)) {
        this.saturation = 0;
      }
    } else if (this.lightness != null) {

    // Hue Saturation Lightness
    // (no conversions needed here)
    } else if (options.brightness != null) {
      throw new TypeError("{hue, saturation, brightness} not supported. Use {hue, saturation, value} instead for an equivalent color space");
    } else {
      reject_args();
    }
    [this.red, this.green, this.blue] = hsl2rgb(this.hue, this.saturation, this.lightness);
  } else if ((cyan != null) && (magenta != null) && (yellow != null) && (key != null)) {
    // Cyan Magenta Yellow blacK
    throw new Error("CMYK color space is not currently supported");
    this.red = 1 - Math.min(1, cyan * (1 - key) + key);
    this.green = 1 - Math.min(1, magenta * (1 - key) + key);
    this.blue = 1 - Math.min(1, yellow * (1 - key) + key);
  } else {
    // TODO: rename l -> lightness?
    // a/b -> aChroma/bChroma? aChrominance/bChrominance??
    if ((options.l != null) && (options.a != null) && (options.b != null)) {
      throw new Error("L*a*b* color space is not currently supported");
      white_D50 = {
        x: 96.422,
        y: 100.000,
        z: 82.521
      };
      // white_D65 =
      // 	x: 95.047
      // 	y: 100.000
      // 	z: 108.883
      options.a -= 1 / 2;
      options.b -= 1 / 2;
      // TODO: Get this actually working, using Information and Math instead of Fiddling Around
      // It would be nice if I could find some XYZ palettes,
      // since the LAB handling depends on the XYZ handling.
      options.l = Math.pow(options.l, 2); // messing around
      options.l *= 15; // messing around
      options.a *= 80; // messing around
      options.b *= 80; // messing around
      xyz = {
        y: (options.l + 16) / 116
      };
      xyz.x = options.a / 500 + xyz.y;
      xyz.z = xyz.y - options.b / 200;
      ref = "xyz";
      for (j = 0, len1 = ref.length; j < len1; j++) {
        c = ref[j];
        powed = Math.pow(xyz[c], 3);
        if (powed > 0.008856) {
          xyz[c] = powed;
        } else {
          xyz[c] = (xyz[c] - 16 / 116) / 7.787;
        }
        // set {x, y, z} options for fallthrough
        options[c] = xyz[c] * white_D50[c];
      }
    }
    // fallthrough
    if ((options.x != null) && (options.y != null) && (options.z != null)) {
      throw new Error("XYZ color space is not currently supported");
      ({x, y, z} = options);
      rgb = {
        r: x * 3.2406 + y * -1.5372 + z * -0.4986,
        g: x * -0.9689 + y * 1.8758 + z * 0.0415,
        b: x * 0.0557 + y * -0.2040 + z * 1.0570
      };
      ref1 = "rgb";
      
      // r =  3.2404542*x - 1.5371385*y - 0.4985314*z
      // g = -0.9692660*x + 1.8760108*y + 0.0415560*z
      // b =  0.0556434*x - 0.2040259*y + 1.0572252*z
      for (l = 0, len2 = ref1.length; l < len2; l++) {
        c = ref1[l];
        if (rgb[c] < 0) {
          rgb[c] = 0;
        }
        if (rgb[c] > 0.0031308) {
          rgb[c] = 1.055 * Math.pow(rgb[c], 1 / 2.4) - 0.055;
        } else {
          rgb[c] *= 12.92;
        }
      }
      this.red = rgb.r;
      this.green = rgb.g;
      this.blue = rgb.b;
    } else {
      reject_args();
    }
  }
}
