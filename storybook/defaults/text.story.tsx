import React from "react"
import { storiesOf } from "@storybook/react-native"
import { Story, StoryScreen, UseCase } from "../views"
import { Text } from "@rneui/themed"
import colors from "@app/rne-theme/colors"

const textVariations = ["h1", "h2", "p1", "p2", "p3", "p4"]

storiesOf("Theme text", module)
  .addDecorator((fn) => <StoryScreen>{fn()}</StoryScreen>)
  .add("Style Presets", () => (
    <Story>
      {textVariations.map((variation) => {
        return (
          <UseCase text={variation}>
            <Text type={variation as any}>Some useless text</Text>
            <Text type={variation as any} bold>
              Some bold useless text
            </Text>
            <Text type={variation as any} color={colors.primary} bold>
              Some colorful useless text
            </Text>
          </UseCase>
        )
      })}
    </Story>
  ))
