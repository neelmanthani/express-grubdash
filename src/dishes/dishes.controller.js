const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function validateFields(req, res, next) {
    const {data: {name, description, price, image_url}} = req.body;

    if (!name || name === "") {
        next({
            status: 400,
            message: `Dish must include a name`
        })
    }

    res.locals.name = name;

    if (!description || description === ""){
        next({
            status: 400,
            message: `Dish must include a description`
        })
    }

    res.locals.description = description

    if (!price){
        next({
            status: 400,
            message: `Dish must include a price`
        })
    } else {
        if (!Number.isInteger(price) || price <= 0) {
            next({
                status: 400,
                message: `Dish must have a price that is an integer greater than 0`
            })
        }
    }

    res.locals.price = price;

    if (!image_url || image_url === "") {
        next({
            status: 400,
            message: `Dish must include a image_url`
        })
    }

    res.locals.image_url = image_url;

    return next();

}

function validateId(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);

    if (foundDish) {
        res.locals.dish = foundDish;
        res.locals.dishId = dishId;
        return next();
    } else {
        next({
            status: 404,
            message: `Dish does not exist: ${dishId}.`
        })
    }

}

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res, next) {
    res.json({data: dishes});
}

function create(req, res, next) {
    const newDish = {
        id: nextId(),
        name: res.locals.name,
        description: res.locals.description,
        price: res.locals.price,
        image_url: res.locals.image_url
    }

    dishes.push(newDish);

    res.status(201).json({data: newDish})
}

function update(req, res, next) {
    const id = req.body.data.id
    if (id) {
        if (id != res.locals.dishId) {
            return next({
                status: 400,
                message: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dishId}`
            })
        }
    }

    res.locals.dish.name = res.locals.name;
    res.locals.dish.description = res.locals.description;
    res.locals.dish.price = res.locals.price;
    res.locals.dish.image_url = res.locals.image_url;

    res.json({data: res.locals.dish});
}

function read(req, res, next) {
    res.json({data: res.locals.dish});
}


module.exports = {
    list,
    create: [validateFields, create],
    read: [validateId, read],
    update: [validateId, validateFields, update],
    
}
