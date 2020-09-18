export default function(model) {
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