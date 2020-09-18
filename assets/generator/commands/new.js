module.exports = {
    run: function run({module}) {
        return {
            steps: [
                {
                    type: "template",
                    to: "hello-world.txt",
                    from: "hello-world.txt",
                    engine: "ejs"
                }
            ]
        }
    }
}