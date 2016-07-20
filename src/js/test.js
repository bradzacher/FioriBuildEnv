
//console.log();

var x = () => document.body.innerHTML = 'HELLO, WORLD!' + '13' + Date.now();

x();

var y = {
    lambda: () => {
        document.body.innerHTML += '\n' + JSON.stringify(this);
    },
    fn: function() {
        document.body.innerHTML += '\n' + JSON.stringify(this);
    }
};

y.lambda();
y.fn();
