var speed = 2500;
var tronCount = 100;
var aFrame;
function Random(integer) {
	return Math.floor(Math.random() * integer);
}
function complementaryColor(color1, color2) {
	var div = Random(256);
	var red1 = Math.floor(color1 / 256 / 256);
	var red2 = Math.floor(color2 / 256 / 256);
	var gre1 = Math.floor((color1 - red1 * 256 * 256) / 256);
	var gre2 = Math.floor((color2 - red2 * 256 * 256) / 256);
	var blu1 = Math.floor(color1 - gre1 * 256 - red1 * 256 * 256);
	var blu2 = Math.floor(color2 - gre2 * 256 - red2 * 256 * 256);
	return {
		red: Math.floor(red1 + div * ((red2 - red1) / 256)),
		green: Math.floor(gre1 + div * ((gre2 - gre1) / 256)),
		blue: Math.floor(blu1 + div * ((blu2 - blu1) / 256))
	};
}

function JsTron(color1, color2) {
	var complementary = $('#colors').prop('checked');
	this.x = 0;
	this.y = 0;
	this.d = Random(4);
	this.active = false;
	this.complementary = complementary;
	this.color1 = color1;
	this.color2 = color2;
	if (complementary) {
		var color = complementaryColor(color1, color2);
		this.red = color.red;
		this.green = color.green;
		this.blue = color.blue;
	} else {
		this.red = Random(256);
		this.green = Random(256);
		this.blue = Random(256);
	}
};
JsTron.prototype.Clone = function() {
	return {
		x: this.x,
		y: this.y,
		d: this.d
	};
};
JsTron.prototype.GetPixel = function(imageData) {
	var colorSum = 0;
	for (var i = 0; i < 4; i++) {
		colorSum += imageData.data[((this.y*(imageData.width*4)) + (this.x*4)) + i];
	}
	return colorSum;
};
JsTron.prototype.SetPixel = function(imageData) {
	if (this.active) {
		imageData.data[((this.y*(imageData.width*4)) + (this.x*4))] = this.red;
		imageData.data[((this.y*(imageData.width*4)) + (this.x*4)) + 1] = this.green;
		imageData.data[((this.y*(imageData.width*4)) + (this.x*4)) + 2] = this.blue;
		imageData.data[((this.y*(imageData.width*4)) + (this.x*4)) + 3] = 255;
	}
};
JsTron.prototype.Init = function(imageData, resetColor) {
	resetColor = resetColor || false;
	var tries = 0;
	do {
		tries++;
		this.x = Random(imageData.width);
		this.y = Random(imageData.height);
	} while (this.GetPixel(imageData) > 0 && tries < 1000);
	if (tries < 1000) {
		this.active = true;
		if (resetColor) {
			if (this.complementary) {
				var color = complementaryColor(this.color1, this.color2);
				this.red = color.red;
				this.green = color.green;
				this.blue = color.blue;
			} else {
				this.red = Random(256);
				this.green = Random(256);
				this.blue = Random(256);
			}
		}
	} else {
		this.active = false;
	}
};
JsTron.prototype.NewXY = function(maxX, maxY) {
	switch (this.d) {
		case 0:
			this.x++;
			this.x = this.x >= maxX ? 0 : this.x;
			break;
		case 1:
			this.y++;
			this.y = this.y >= maxY ? 0 : this.y;
			break;
		case 2:
			this.x--;
			this.x = this.x < 0 ? maxX - 1 : this.x;
			break;
		case 3:
			this.y--;
			this.y = this.y < 0 ? maxY - 1 : this.y;
			break;
	}
};
JsTron.prototype.Move = function(imageData) {
	if (this.active) {
		var oldVals = this.Clone();
		this.NewXY(imageData.width, imageData.height);
		if (this.GetPixel(imageData) > 0) {
			this.x = oldVals.x;
			this.y = oldVals.y;
			this.d += Random(2) * 2 - 1;
			this.d %= 4;
			this.NewXY(imageData.width, imageData.height);
			if (this.GetPixel(imageData) > 0) {
				this.x = oldVals.x;
				this.y = oldVals.y;
				this.d += 2;
				this.d %= 4;
				this.NewXY(imageData.width, imageData.height);
				if (this.GetPixel(imageData) > 0) {
					this.Init(imageData, true);
				}
			}
		}
	}
};

$.fn.JsTron = function(numberOfLightBikes) {
	var $this = $(this.get(0));
	var context = this.get(0).getContext('2d');
	var bikeCount = numberOfLightBikes || 10;
	var imageData = context.createImageData($this.width(), $this.height());
	
	var color1 = Random(256) * 256 * 256 + Random(256) * 256 + Random(256);
	var color2 = Random(256) * 256 * 256 + Random(256) * 256 + Random(256);

	var animation = function() {
		var alive = 0;
		var startTime = performance.now();
		do {
			alive = 0;
			$(trons).each(function(idx, tron) {
				tron.Move(imageData);
				tron.SetPixel(imageData);
				alive += tron.active ? 1 : 0;
			});
		} while (performance.now() - startTime < 1000 / speed && alive);
		context.putImageData(imageData, 0, 0);
		$('.alive').html(alive);
		$('.count').html(tronCount);
		$('.speed').html(2500 - speed);
		if (alive > 0) {
			aFrame = requestAnimationFrame(animation);
		}
	};
	
	var trons = [];
	for (var i = 0; i < bikeCount; i++) {
		var tron = new JsTron(color1, color2);
		tron.Init(imageData);
		trons.push(tron);
	}
	aFrame = requestAnimationFrame(animation);
	return this;
};


$(function() {
	$('.tron').JsTron(tronCount);
	$('.small').on('click', function() {
		$('.tron').width($('.tron').width() + 1);
	});
	$('#slider-speed').slider({
		max: 5000,
		min: 0,
		value: 2500,
		change: function(event, ui) {
			speed = Math.max(5000 - ui.value, 1);
		}
	});
	$('#slider-count').slider({
		value: tronCount,
		max: 1500,
		min: 2,
		change: function(event, ui) {
			tronCount = ui.value;
		}
	});
	$('.reset').on('click', function() {
		cancelAnimationFrame(aFrame);
		$('.tron').JsTron(tronCount);
	});
});