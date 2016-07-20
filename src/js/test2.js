
class test {
    fn() {
        document.body.innerHTML += '\n' + JSON.stringify(this);
    }
}

var z = new test();
z.fn();