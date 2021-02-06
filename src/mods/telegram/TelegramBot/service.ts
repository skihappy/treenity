import { addComponent } from '../../../treenity/context/context-db';
import { TelegramBot } from '../TelegramBot.meta';
import { useEffect } from 'react';
import { types } from 'mobx-state-tree';


export default ({ meta, addComponent }) => {
  const Model = meta('model', types.model({
    portField: OutPort(SomeMetaType),
  }));

  addComponent('service', {}, ({ value }: { Instance<typeof Model> }) => {
    const port = usePort('portField', (node) => {

    });

    const onChange = () => {
      port(Node.create({}));
    };

    useEffect(() => {
      console.log('starting telegram', value.token);
      const token = value.token;
      return () => console.log('stopping telegram', token);
    }, []);
    return null;
  });
}
