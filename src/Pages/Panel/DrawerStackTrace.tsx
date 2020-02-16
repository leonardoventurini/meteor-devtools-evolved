import React, { FunctionComponent } from 'react';
import { Classes, Drawer } from '@blueprintjs/core';
import { usePanelStore } from '../../Stores/PanelStore';
import { observer } from 'mobx-react-lite';

export const DrawerStackTrace: FunctionComponent = observer(() => {
  const panelStore = usePanelStore();

  return (
    <Drawer
      icon='document'
      title='Stack Trace'
      isOpen={!!panelStore?.activeStackTrace}
      onClose={() => {
        panelStore?.setActiveStackTrace(null);
      }}
    >
      <div className={Classes.DRAWER_BODY}>
        <div className={Classes.DIALOG_BODY}>
          {panelStore?.activeStackTrace?.map(
            (stack: StackTrace, index: number) => {
              const text = (
                <div>
                  <em>{stack?.functionName?.trim() ?? 'Anonymous'}</em>
                  {'@'}
                  <span>
                    {stack?.columnNumber && stack?.columnNumber}
                    {stack?.columnNumber && stack?.lineNumber ? ':' : null}
                    {stack?.lineNumber && stack?.lineNumber}
                  </span>
                </div>
              );

              return (
                <pre key={index} style={{ marginBottom: 6 }}>
                  {stack?.fileName ? (
                    <a
                      href={stack.fileName.trim()}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {text}
                    </a>
                  ) : (
                    text
                  )}
                </pre>
              );
            },
          )}
        </div>
      </div>
    </Drawer>
  );
});
