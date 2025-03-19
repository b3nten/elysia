abstract class IComponent {
    onStartup?(): void;
    x: number;
}

function ComponentBase(this: IComponent, arg2: void): void {
    if(new.target) {
        // @ts-ignore
        this.ctor();
    } else {
        // @ts-ignore
        return class extends ComponentBase {
            onStartup() {
                // @ts-ignore
                arg2.onStartup?.call(this);
            }
        }
    }
}

ComponentBase.prototype.ctor = function() {
    // implement IComponent constructor
    this.x = 0;
}

const Component = ComponentBase as unknown as (new () => IComponent) & ((a: Partial<IComponent>) => new () => IComponent);

let ProtoComp = Component({
    onStartup() {
        console.log(this.x)
    }
});

class ClassComp extends Component {
    onStartup() {
        console.log(this.x)
    }
}

let proto = new ProtoComp();
let klass = new ClassComp();

console.log(proto instanceof Component, proto instanceof ProtoComp, proto instanceof ClassComp);
console.log(klass instanceof Component, klass instanceof ClassComp, klass instanceof ProtoComp);

proto.onStartup();
klass.onStartup();

parent.addComponent(class extends Component {
    onStartup() {
        // do something
    }
})