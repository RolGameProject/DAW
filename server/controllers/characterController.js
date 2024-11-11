const { Character, ABILITY_NAMES, CLASS_NAMES } = require('../models/characterModel'); // Importamos el modelo Character junto con las constantes para nombres de habilidades y clases

exports.createCharacter = async (req, res) => {
  const { name, classType, abilities, health } = req.body;

  // Validar que la salud esté dentro del rango permitido (0 a 100)
  if (health < 0 || health > 100) {
    return res.status(400).json({ error: "La salud debe estar entre 0 y 100." });
  }

  // Validar que la clase proporcionada sea válida según las clases permitidas
  if (!CLASS_NAMES.includes(classType)) {
    return res.status(400).json({ error: `La clase debe ser una de las siguientes: ${CLASS_NAMES.join(', ')}.` });
  }

  // Validar que se proporcionen todas las habilidades y que estén en el formato correcto
  if (!Array.isArray(abilities) || abilities.length !== ABILITY_NAMES.length) {
    return res.status(400).json({ error: "Se deben proporcionar todas las habilidades." });
  }
  for (let ability of abilities) {
    // Verificar que cada habilidad tenga un nombre válido
    if (!ABILITY_NAMES.includes(ability.name)) {
      return res.status(400).json({ error: `La habilidad debe ser una de las siguientes: ${ABILITY_NAMES.join(', ')}.` });
    }
    // Validar que el valor de cada habilidad esté dentro del rango permitido (-50 a 100)
    if (ability.value < -50 || ability.value > 100) {
      return res.status(400).json({ error: "El valor de las habilidades debe estar entre -50 y 100." });
    }
  }

  try {
    // Crear y guardar el nuevo personaje en la base de datos
    const newCharacter = new Character({ name, classType, abilities, health });
    await newCharacter.save();
    res.status(201).json(newCharacter); // Enviamos la respuesta con el personaje creado
  } catch (error) {
    // En caso de error, enviamos un mensaje de error
    res.status(400).json({ error: error.message });
  }
};

// Controlador para obtener todos los personajes
exports.getAllCharacters = async (req, res) => {
  try {
    const characters = await Character.find(); // Recupera todos los personajes de la base de datos
    res.status(200).json(characters); // Enviamos los personajes como respuesta
  } catch (error) {
    res.status(500).json({ error: error.message }); // Error del servidor si falla la operación
  }
};

// Controlador para obtener un personaje por su ID
exports.getCharacterById = async (req, res) => {
  const { id } = req.params; // Obtenemos el ID desde los parámetros de la solicitud

  try {
    const character = await Character.findById(id); // Busca un personaje por su ID en la base de datos
    if (!character) {
      return res.status(404).json({ error: "Personaje no encontrado." }); // Si no existe, enviamos un error 404
    }
    res.status(200).json(character); // Enviamos el personaje encontrado
  } catch (error) {
    res.status(500).json({ error: error.message }); // Error del servidor si ocurre un problema
  }
};

// Controlador para actualizar un personaje por su ID
exports.updateCharacterById = async (req, res) => {
  const { id } = req.params; // Obtenemos el ID desde los parámetros de la solicitud
  const { name, classType, abilities, health } = req.body; // Datos del cuerpo de la solicitud para actualizar

  try {
    const character = await Character.findById(id); // Busca el personaje por su ID
    if (!character) {
      return res.status(404).json({ error: "Personaje no encontrado." }); // Si no existe, retornamos error 404
    }

    // Validar la clase si se proporciona una nueva
    if (classType && !CLASS_NAMES.includes(classType)) {
      return res.status(400).json({ error: `La clase debe ser una de las siguientes: ${CLASS_NAMES.join(', ')}.` });
    }

    // Validar las habilidades si se proporcionan nuevas
    if (abilities) {
      if (!Array.isArray(abilities) || abilities.length === 0) {
        return res.status(400).json({ error: "Las habilidades son obligatorias." });
      }
      for (let ability of abilities) {
        // Validar nombre y valor de cada habilidad
        if (!ABILITY_NAMES.includes(ability.name)) {
          return res.status(400).json({ error: `La habilidad debe ser una de las siguientes: ${ABILITY_NAMES.join(', ')}.` });
        }
        if (ability.value < -50 || ability.value > 100) {
          return res.status(400).json({ error: "El valor de las habilidades debe estar entre -50 y 100." });
        }
      }
      character.abilities = abilities; // Actualizamos las habilidades si son válidas
    }

    // Actualizar solo los campos que se hayan proporcionado
    if (name) character.name = name;
    if (classType) character.classType = classType;
    if (health !== undefined) {
      // Validar el nuevo valor de salud antes de actualizar
      if (health < 0 || health > 100) {
        return res.status(400).json({ error: "La salud debe estar entre 0 y 100." });
      }
      character.health = health;
    }

    const updatedCharacter = await character.save(); // Guardar los cambios en la base de datos
    res.status(200).json(updatedCharacter); // Devolvemos el personaje actualizado
  } catch (error) {
    res.status(400).json({ error: error.message }); // Error en la actualización
  }
};

// Controlador para eliminar un personaje por su ID
exports.deleteCharacterById = async (req, res) => {
  const { id } = req.params; // Obtenemos el ID desde los parámetros de la solicitud

  try {
    const deletedCharacter = await Character.findByIdAndDelete(id); // Eliminamos el personaje de la base de datos
    if (!deletedCharacter) {
      return res.status(404).json({ error: "Personaje no encontrado." }); // Si no se encuentra, retornamos error 404
    }
    res.status(204).send(); // Si se elimina correctamente, enviamos una respuesta sin contenido
  } catch (error) {
    res.status(500).json({ error: error.message }); // Error del servidor si ocurre un problema
  }
};
