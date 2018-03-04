var correspondecias = [];
var means_salida = [];
var imagenes = [];
//funciones auxiliares
rgbToHex = (r, g, b) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
hexToRgb = (hex) => {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}
f = (t) => {
	if (t > Math.pow(6 / 29, 3))
		return Math.pow(t, 1 / 3);
	else
		return (1 / 3) * Math.pow(29 / 6, 2) * t + 4 / 29;
}




var app = (function () {

	var canvas = document.getElementById('canvas'),
		context = canvas.getContext('2d'),

		public = {};
	public.loadPicture = function () {

		var color = document.getElementById("color1");
		color.value = rgbToHex(56,182,199);
		

		var imagObj = new Image();
		
		
		imagObj.src = document.getElementById("texto").value;
		

		imagObj.onload = function () {
			context.drawImage(imagObj, 0, 0);
		};

		public.getImgData = function () {
			return context.getImageData(0, 0, canvas.width, canvas.height);
		}
		public.filters = {};
		public.filters.bw = function () {
			context.drawImage(imagObj, 0, 0);
			var imageData = app.getImgData(),
				pixels = imageData.data,
				numPixels = imageData.width * imageData.height;
			for (var i = 0; i < numPixels/2; i++) {
				var r = pixels[i * 4];
				var g = pixels[i * 4 + 1];
				var b = pixels[i * 4 + 2];

				var grey = (r + g + b) / 3;

				pixels[i * 4] = grey;
				pixels[i * 4 + 1] = grey;
				pixels[i * 4 + 2] = grey;
			}
			for (var i = numPixels/2; i < numPixels; i++) {
				pixels[i * 4] = 1;
				pixels[i * 4 + 1] = 1;
				pixels[i * 4 + 2] = 1;
			}
			imagenes[0] = imageData;
			
			context.putImageData(imageData, 0, 0);
		};
		public.filters.sepia = () => {
			context.drawImage(imagObj, 0, 0);
			var imageData = app.getImgData(),
				pixels = imageData.data,
				numPixels = imageData.width * imageData.height;
			
			for (var i = numPixels / 2; i < numPixels; i++) {
				var r = pixels[i * 4];
				var g = pixels[i * 4 + 1];
				var b = pixels[i * 4 + 2];

				pixels[i * 4] = 255 - r;
				pixels[i * 4 + 1] = 255 - g;
				pixels[i * 4 + 2] = 255 - b;

				pixels[i * 4] = (r * .393) + (g * .769) + (b * .189);
				pixels[i * 4 + 1] = (r * .349) + (g * .686) + (b * .168);
				pixels[i * 4 + 2] = (r * .272) + (g * .534) + (b * .132);
			}
			for (var i = 0; i < numPixels / 2; i++) {
				pixels[i * 4] = 1;
				pixels[i * 4 + 1] = 1;
				pixels[i * 4 + 2] = 1;
			}
			imagenes[1] = imageData;
			context.putImageData(imageData, 0, 0);
		}

		public.Ale = {};
		public.Ale.centros = (k) => {
			var means = [];
			//iniciamos al azar, por ahora
			means[0] = [];
			means[0][0] = 0;
			means[0][1] = 0;
			means[0][2] = 0;
			for (var i = 1; i <= k; i++) {
				means[i] = [, ,];
				means[i][0] = Math.floor((Math.random() * 255));
				means[i][1] = Math.floor((Math.random() * 255));
				means[i][2] = Math.floor((Math.random() * 255));
			}

			return means;
		}
		public.Ale.copiar = (mean) => {
			var cpy_m = [];
			for (var i = 0; i < mean.length; i++) {
				cpy_m[i] = [, ,];
				cpy_m[i][0] = mean[i][0];
				cpy_m[i][1] = mean[i][1];
				cpy_m[i][2] = mean[i][2];
			}
			return cpy_m;
		}
		public.Ale.diferencial = (k1, k2) => {
			if (k1.length != k2.length) {
				return -1;
			}
			var l = k1.length,
				dif = 0;
			for (var i = 1; i < l; i++) {
				dif += Math.abs(k1[i][0] - k2[i][0]);
				dif += Math.abs(k1[i][1] - k2[i][1]);
				dif += Math.abs(k1[i][2] - k2[i][2]);
			}
			return dif;
		}
		public.Ale.mas_cercano = (pixel, means) => {
			var corr = 0,
				last_d = 255 * 3,
				l = means.length;
			//aun no es diferencia euclidiana
			for (var i = 0; i < l; i++) {
				var d = Math.sqrt(Math.pow(pixel[0] - means[i][0], 2) + Math.pow(pixel[1] - means[i][1], 2) + Math.pow(pixel[2] - means[i][2], 2));
				
				if (d < last_d) {
					corr = i;
					last_d = d;
				}
			}
			return corr;
		}
		public.Ale.procesar = (K) => {
			var imageData = app.getImgData(),
				pixels = imageData.data,
				numpixels = imageData.width * imageData.height,
				means = public.Ale.centros(K),
				C_R = [], C_G = [], C_B = [], C = [];
			//llenar 0's
			for (var i = 0; i < K + 1; i++) {
				C_R[i] = 0;
				C_G[i] = 0;
				C_B[i] = 0;
				C[i] = 0;
			}


			do {
				var old_means = public.Ale.copiar(means);
				for (var i = 0; i < numpixels; i++) {
					correspondecias[i] = public.Ale.mas_cercano([pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4] + 2], means);
				}
				for (var i = 0; i < numpixels; i++) {
					C_R[correspondecias[i]] += pixels[i * 4];
					C_G[correspondecias[i]] += pixels[i * 4 + 1];
					C_B[correspondecias[i]] += pixels[i * 4 + 2];
					C[correspondecias[i]]++;
				}
				for (var i = 1; i < K + 1; i++) {
					if (C[i] != 0) {
						means[i][0] = Math.floor(C_R[i] / C[i]);
						means[i][1] = Math.floor(C_G[i] / C[i]);
						means[i][2] = Math.floor(C_B[i] / C[i]);
					}
				}
			} while (public.Ale.diferencial(means, old_means) > 3 * K)

			console.log(means);
			console.log(correspondecias.length);
			means_salida = means;
			//llenar las paletas
			for (var i = 0; i < means.length; i++) {
				var colorp = document.getElementById("color" + i.toString());
				colorp.value = rgbToHex(means[i][0], means[i][1], means[i][2]);
				colorp.hidden = false;
				if (i == 0) {
					colorp.disabled = "disabled";
				}
			}
			//console.log(means_salida);
			public.Ale.Dividir();
			return means;
		}
		public.Ale.leer_corrs = () => {
			var selec_x_color;
			for (var i = 0; i < correspondecias.length(); i++) {
				if (correspondecias[i] == 1) {
					selec_x_color.push(correspondecias[i]);
				}
			}
			console.log(selec_x_color);
		}
		public.Ale.Dividir = () => {
			var images = [];
			var imagen_base = app.getImgData();
			for (var i = 0; i < 10; i++) {
				imagen_temp = app.getImgData();
				images.push(imagen_temp);
			}

			numPixels = images[0].width * images[0].height;

			

			for (var j = 0; j < 10; j++) {
				for (var i = 0; i < numPixels; i++) {
					if (correspondecias[i] != j) {
						images[j].data[i * 4] = 0;
						images[j].data[i * 4 + 1] = 0;
						images[j].data[i * 4 + 2] = 0;
					}

				}
			}
			imagenes = images;

		}
		public.Ale.setColor = (indice) => {
			var pixels = imagenes[indice].data,
				numpixels = imagenes[indice].width * imagenes[indice].height,
				colorp = document.getElementById("color" + indice.toString());
			ncolor = hexToRgb(colorp.value);

			for (var i = 0; i < numpixels; i++) {
				if (pixels[i * 4] == 0 && pixels[i * 4 + 1] == 0 && pixels[i * 4 + 2] == 0) {
					continue;
				}
				else {
					pixels[i * 4] = ncolor.r;
					pixels[i * 4 + 1] = ncolor.g;
					pixels[i * 4 + 2] = ncolor.b;
				}

			}
			imagenes[indice].data = pixels;
		}

	}
	return public;
}())