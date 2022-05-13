import { Classes, Drawer, Tag } from '@blueprintjs/core'
import React, { FunctionComponent } from 'react'
import { Separator } from '@/Components/Separator'

interface Props {
  isSponsorVisible: boolean

  onClose(): void
}

export const Sponsor: FunctionComponent<Props> = ({
  isSponsorVisible,
  onClose,
}) => {
  return (
    <Drawer
      icon='cloud'
      title={
        <>
          Meteor Cloud{' '}
          <Tag
            style={{
              position: 'relative',
              bottom: 4,
              left: 4,
            }}
            minimal
            round
          >
            Sponsor
          </Tag>
        </>
      }
      isOpen={isSponsorVisible}
      onClose={onClose}
      size='72%'
    >
      <div className={Classes.DRAWER_BODY}>
        <div className={Classes.DIALOG_BODY}>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non
            eleifend leo. In egestas magna a tortor scelerisque tempor. Donec
            molestie blandit diam, sed rutrum eros finibus sit amet. Suspendisse
            ut porttitor nisl, vel dictum eros. Nam ut pellentesque nisi. Duis
            faucibus erat sed magna porta, non pulvinar neque efficitur. Quisque
            malesuada magna vel dolor tempus, venenatis rutrum mauris feugiat.
            Cras vel porttitor neque. Praesent pharetra nibh ut nulla fermentum
            dictum. Nunc semper nulla magna, nec tincidunt justo accumsan vitae.
            Etiam diam elit, maximus sit amet laoreet vitae, semper id velit.
            Morbi posuere luctus finibus. Sed semper rutrum nulla, id efficitur
            neque accumsan eu. Suspendisse potenti. Etiam tempus, magna non
            elementum condimentum, nibh ligula dignissim arcu, sagittis dictum
            purus urna ut dolor. Nunc condimentum, enim vel auctor egestas, elit
            lectus mollis arcu, id elementum sem nisi vitae ligula.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <iframe
              width='560'
              height='315'
              src='https://www.youtube.com/embed/qq2CssWFQ7o'
              title='YouTube video player'
              frameBorder='0'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
              allowFullScreen
              style={{
                margin: '0 auto',
              }}
            />
          </div>

          <p>
            Duis tristique in nulla non pharetra. Maecenas tristique est mauris,
            ut ultrices elit tristique eget. Sed condimentum massa a nunc
            pretium sollicitudin. Praesent eu ligula dui. Vestibulum eleifend
            iaculis turpis vel pretium. Mauris sapien libero, porta eget mi
            quis, interdum mattis lectus. Quisque at urna vitae erat semper
            scelerisque. Aliquam lacus lorem, vehicula vel elit sed, dignissim
            gravida ex. Pellentesque non diam neque.
          </p>

          <p>
            Donec gravida rhoncus arcu, sit amet aliquam nunc hendrerit eu. Ut a
            leo ut purus blandit sollicitudin. Duis tempor, ex quis pretium
            bibendum, turpis turpis rutrum lorem, sed varius nulla diam eu quam.
            Nulla facilisi. Donec a lobortis nibh. Pellentesque molestie
            eleifend dolor, et varius tortor feugiat eget. Aenean tincidunt sed
            sapien et faucibus. Sed quam urna, scelerisque vel vulputate eget,
            commodo sit amet augue. Morbi mattis est nec lacus pulvinar, vitae
            venenatis tellus venenatis. Donec gravida finibus risus et
            sollicitudin.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <a
              href='https://www.meteor.com/developers/tutorials'
              target='_blank'
              rel='noreferrer'
            >
              Tutorials
            </a>
            <Separator />
            <a
              href='https://forums.meteor.com'
              target='_blank'
              rel='noreferrer'
            >
              Forums
            </a>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
